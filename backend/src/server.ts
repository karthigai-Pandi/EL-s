import "dotenv/config";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { Prisma, PrismaClient, OrderStatus } from "@prisma/client";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Razorpay from "razorpay";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 4000);
const maxUploadBytes = 25 * 1024 * 1024;
const maxWebhookBytes = 1024 * 1024;
const finishOptions = { standard: 1, matte: 1.12, gloss: 1.12, weatherproof: 1.18 } as const;
const statuses = new Set(Object.values(OrderStatus));
const allowedTypes: Record<string, string[]> = {
  pdf: ["application/pdf", "application/octet-stream"],
  ai: ["application/postscript", "application/illustrator", "application/pdf", "application/octet-stream"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    const allowed = (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000")
      .split(",").map((value) => value.trim()).filter(Boolean);
    let previewOrigin = false;
    if (origin) {
      try {
        const hostname = new URL(origin).hostname;
        previewOrigin = hostname === "localhost" || hostname.endsWith(".vercel.app");
      } catch {
        previewOrigin = false;
      }
    }
    if (!origin || allowed.includes(origin) || previewOrigin) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Razorpay-Signature", "X-Razorpay-Event-Id"],
}));

const asyncRoute = (handler: (request: Request, response: Response) => Promise<unknown>) =>
  (request: Request, response: Response, next: NextFunction) => { void handler(request, response).catch(next); };

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAdmin(request: Request) {
  const expected = process.env.ADMIN_TOKEN ?? "";
  const supplied = request.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return expected.length >= 24 && safeEqual(expected, supplied);
}

function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (!isAdmin(request)) return response.status(401).json({ error: "Unauthorized." });
  return next();
}

function getStorage() {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error("Artwork storage is not configured.");
  const client = new S3Client({
    region: process.env.S3_REGION || "ap-south-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: { accessKeyId, secretAccessKey },
  });
  return { bucket, client };
}

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured.");
  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId, keySecret };
}

function signatureMatches(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

app.get("/health", (_request, response) => response.json({ status: "ok", service: "els-studio-api" }));

app.get("/api/services", asyncRoute(async (_request, response) => {
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  response.json({ services: services.map((service) => ({ ...service, ratePerSqft: Number(service.ratePerSqft) })) });
}));

app.get("/api/portfolio", asyncRoute(async (_request, response) => {
  const items = await prisma.portfolioItem.findMany({ where: { featured: true }, orderBy: { sortOrder: "asc" } });
  response.json({ items });
}));

const uploadSchema = z.object({ fileName: z.string().min(1).max(180), contentType: z.string().min(1).max(120), fileSize: z.number().int().positive().max(maxUploadBytes) });
app.post("/api/uploads/presign", express.json({ limit: "10kb" }), asyncRoute(async (request, response) => {
  const parsed = uploadSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid artwork details." });
  const extension = parsed.data.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedTypes[extension]?.includes(parsed.data.contentType)) return response.status(400).json({ error: "Unsupported artwork file type." });
  const { bucket, client } = getStorage();
  const key = `artwork/${randomBytes(16).toString("hex")}.${extension}`;
  const contentType = parsed.data.contentType;
  const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: parsed.data.fileSize, ServerSideEncryption: "AES256" }), { expiresIn: 300 });
  response.json({ key, uploadUrl, contentType });
}));

const orderSchema = z.object({
  serviceSlug: z.string().min(1).max(80),
  widthFt: z.number().finite().min(0).max(1000),
  heightFt: z.number().finite().min(0).max(1000),
  widthFeet: z.number().finite().min(0).max(1000).optional(),
  widthInches: z.number().finite().min(0).max(11.99).optional(),
  heightFeet: z.number().finite().min(0).max(1000).optional(),
  heightInches: z.number().finite().min(0).max(11.99).optional(),
  quantity: z.number().int().min(1).max(500),
  finish: z.enum(["standard", "matte", "gloss", "weatherproof"]),
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/),
  email: z.string().trim().email().max(254),
  fulfillment: z.enum(["delivery", "pickup"]),
  address: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  designFileKey: z.string().regex(/^artwork\/[a-f0-9]{32}\.[a-z0-9]{2,5}$/i),
  designFileName: z.string().min(1).max(180),
}).superRefine((value, context) => {
  if (value.fulfillment === "delivery" && value.address.length < 8) context.addIssue({ code: "custom", path: ["address"], message: "Enter a complete delivery address." });
});

app.post("/api/orders", express.json({ limit: "20kb" }), asyncRoute(async (request, response) => {
  const parsed = orderSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message ?? "Check the order details." });
  const input = parsed.data;
  const [service, finish] = await Promise.all([
    prisma.service.findUnique({ where: { slug: input.serviceSlug } }),
    Promise.resolve(finishOptions[input.finish]),
  ]);
  if (!service?.active) return response.status(400).json({ error: "That service is not currently available." });
  const { bucket, client: storageClient } = getStorage();
  const artwork = await storageClient.send(new HeadObjectCommand({ Bucket: bucket, Key: input.designFileKey }));
  if (!artwork.ContentLength || artwork.ContentLength > maxUploadBytes) return response.status(400).json({ error: "Artwork is empty or too large." });

  const ratePerSqft = Number(service.ratePerSqft);
  const areaSqft = input.widthFt * input.heightFt;
  const totalPaise = Math.round(ratePerSqft * areaSqft * input.quantity * finish) * 100;
  if (totalPaise <= 0 || totalPaise > 2_000_000_000) return response.status(400).json({ error: "Estimate is outside online checkout limits. Contact the studio." });
  const orderNumber = `ELS-${new Date().toISOString().slice(2, 7).replace("-", "")}-${randomBytes(8).toString("hex").toUpperCase()}`;
  const order = await prisma.order.create({ data: {
    orderNumber, serviceId: service.id, serviceName: service.name,
    widthFt: input.widthFt, heightFt: input.heightFt, areaSqft, quantity: input.quantity,
    widthFeet: input.widthFeet, widthInches: input.widthInches, heightFeet: input.heightFeet, heightInches: input.heightInches,
    ratePerSqft, optionLabel: input.finish, optionMultiplier: finish, totalPaise,
    customerName: input.customerName, phone: input.phone, email: input.email.toLowerCase(),
    fulfillment: input.fulfillment, address: input.fulfillment === "delivery" ? input.address : null,
    notes: input.notes || null, designFileKey: input.designFileKey, designFileName: input.designFileName,
  } });

  try {
    const { client: razorpay, keyId } = getRazorpay();
    const gatewayOrder = await razorpay.orders.create({ amount: totalPaise, currency: "INR", receipt: orderNumber, notes: { orderId: order.id, orderNumber } });
    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: gatewayOrder.id } });
    response.status(201).json({ key: keyId, orderNumber, razorpayOrderId: gatewayOrder.id, amount: totalPaise, currency: "INR" });
  } catch (error) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED", paymentStatus: "CREATION_FAILED" } });
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Razorpay is not configured")) {
      return response.status(503).json({ error: "Secure payment is temporarily unavailable. Razorpay credentials have not been configured." });
    }
    if (message.toLowerCase().includes("authentication") || message.toLowerCase().includes("razorpay")) {
      return response.status(502).json({ error: "The payment gateway rejected the checkout request. Check the Razorpay credentials." });
    }
    throw error;
  }
}));

app.post("/api/payments/verify", express.json({ limit: "10kb" }), asyncRoute(async (request, response) => {
  const schema = z.object({ orderNumber: z.string().min(1), razorpay_order_id: z.string().min(1), razorpay_payment_id: z.string().min(1), razorpay_signature: z.string().min(1) });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Payment response is incomplete." });
  const { keySecret } = getRazorpay();
  const expected = createHmac("sha256", keySecret).update(`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`).digest("hex");
  if (!signatureMatches(expected, parsed.data.razorpay_signature)) return response.status(400).json({ error: "Payment signature did not match." });
  const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber } });
  if (!order || order.razorpayOrderId !== parsed.data.razorpay_order_id) return response.status(404).json({ error: "Order could not be matched." });
  if (["PAID", "IN_PRODUCTION", "READY", "COMPLETED"].includes(order.status)) return response.json({ ok: true, orderNumber: order.orderNumber });
  await prisma.order.update({ where: { id: order.id }, data: { status: "PAID", paymentStatus: "CAPTURED", razorpayPaymentId: parsed.data.razorpay_payment_id } });
  response.json({ ok: true, orderNumber: order.orderNumber });
}));

app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: maxWebhookBytes }), asyncRoute(async (request, response) => {
  if (!Buffer.isBuffer(request.body)) return response.status(400).json({ error: "Expected raw JSON webhook body." });
  const rawBody = request.body.toString("utf8");
  const signature = request.header("x-razorpay-signature") ?? "";
  const eventId = request.header("x-razorpay-event-id") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !eventId || eventId.length > 200) return response.status(400).json({ error: "Invalid webhook headers." });
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signatureMatches(expected, signature)) return response.status(400).json({ error: "Invalid webhook signature." });
  const payload = JSON.parse(rawBody) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  const eventType = payload.event ?? "unknown";
  const payment = payload.payload?.payment?.entity;
  const gatewayOrderId = payment?.order_id;
  const isCaptured = eventType === "payment.captured" || eventType === "order.paid";
  const isFailed = eventType === "payment.failed";
  const order = (isCaptured || isFailed) && gatewayOrderId ? await prisma.order.findUnique({ where: { razorpayOrderId: gatewayOrderId } }) : null;
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.paymentEvent.create({ data: { gatewayEventId: eventId, eventType, orderId: order?.id, payload: JSON.parse(rawBody) as Prisma.InputJsonValue } });
      if (order && isCaptured) await transaction.order.update({ where: { id: order.id }, data: { status: "PAID", paymentStatus: "CAPTURED", ...(payment?.id ? { razorpayPaymentId: payment.id } : {}) } });
      else if (order && isFailed && order.status === "PENDING_PAYMENT") await transaction.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return response.json({ received: true, duplicate: true });
    throw error;
  }
  response.json({ received: true });
}));

app.get("/api/orders/:orderNumber", asyncRoute(async (request, response) => {
  const orderNumber = request.params.orderNumber;
  if (typeof orderNumber !== "string") return response.status(400).json({ error: "Invalid order reference." });
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { orderNumber: true, serviceName: true, totalPaise: true, status: true, createdAt: true } });
  if (!order) return response.status(404).json({ error: "Order not found." });
  response.json({ order });
}));

app.get("/api/admin/orders", requireAdmin, asyncRoute(async (_request, response) => {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: {
    id: true, orderNumber: true, serviceName: true, areaSqft: true, quantity: true, totalPaise: true,
    customerName: true, phone: true, email: true, fulfillment: true, address: true,
    designFileName: true, designFileKey: true, status: true, paymentStatus: true, createdAt: true,
  } });
  response.json({ orders: orders.map((order) => ({ ...order, areaSqft: Number(order.areaSqft) })) });
}));

app.patch("/api/admin/orders", requireAdmin, express.json({ limit: "10kb" }), asyncRoute(async (request, response) => {
  const parsed = z.object({ orderNumber: z.string().min(1), status: z.string().refine((value) => statuses.has(value as OrderStatus)) }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Choose a valid order status." });
  const order = await prisma.order.update({ where: { orderNumber: parsed.data.orderNumber }, data: { status: parsed.data.status as OrderStatus }, select: { orderNumber: true, status: true } });
  response.json({ order });
}));

app.get("/api/admin/services", requireAdmin, asyncRoute(async (_request, response) => {
  const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  response.json({ services: services.map((service) => ({ ...service, ratePerSqft: Number(service.ratePerSqft) })) });
}));

app.patch("/api/admin/services", requireAdmin, express.json({ limit: "10kb" }), asyncRoute(async (request, response) => {
  const parsed = z.object({ slug: z.string().min(1), ratePerSqft: z.number().finite().min(1).max(100000) }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid service rate." });
  const service = await prisma.service.update({ where: { slug: parsed.data.slug }, data: { ratePerSqft: parsed.data.ratePerSqft }, select: { slug: true, ratePerSqft: true } });
  response.json({ service: { ...service, ratePerSqft: Number(service.ratePerSqft) } });
}));

app.post("/api/admin/artwork", requireAdmin, express.json({ limit: "10kb" }), asyncRoute(async (request, response) => {
  const parsed = z.object({ key: z.string().regex(/^artwork\/[a-f0-9]{32}\.[a-z0-9]{2,5}$/i) }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Invalid artwork reference." });
  const { bucket, client } = getStorage();
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: parsed.data.key }), { expiresIn: 300 });
  response.json({ url });
}));

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  if (message.includes("Origin is not allowed")) return response.status(403).json({ error: "Origin is not allowed." });
  console.error("API request failed", error);
  return response.status(500).json({ error: process.env.NODE_ENV === "production" ? "Request failed." : message });
});

const server = app.listen(port, "0.0.0.0", () => console.log(`EL's Studio API listening on port ${port}`));
process.on("SIGTERM", () => { server.close(() => { void prisma.$disconnect(); }); });
process.on("SIGINT", () => { server.close(() => { void prisma.$disconnect(); }); });