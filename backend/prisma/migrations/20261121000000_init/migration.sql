CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING_PAYMENT', 'PAID', 'IN_PRODUCTION', 'READY', 'COMPLETED', 'CANCELLED', 'PAYMENT_FAILED'
);

CREATE TABLE "Service" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "shortName" TEXT NOT NULL,
  "description" TEXT NOT NULL, "ratePerSqft" DECIMAL(10,2) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioItem" (
  "id" TEXT NOT NULL, "brand" TEXT NOT NULL, "title" TEXT NOT NULL, "category" TEXT NOT NULL,
  "summary" TEXT NOT NULL, "imageUrl" TEXT, "featured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL, "orderNumber" TEXT NOT NULL, "serviceId" TEXT NOT NULL, "serviceName" TEXT NOT NULL,
  "widthFt" DECIMAL(9,3) NOT NULL, "heightFt" DECIMAL(9,3) NOT NULL, "areaSqft" DECIMAL(10,3) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1, "ratePerSqft" DECIMAL(10,2) NOT NULL, "optionLabel" TEXT NOT NULL,
  "optionMultiplier" DECIMAL(5,3) NOT NULL, "totalPaise" INTEGER NOT NULL, "customerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL, "email" TEXT NOT NULL, "fulfillment" TEXT NOT NULL, "address" TEXT, "notes" TEXT,
  "designFileKey" TEXT NOT NULL, "designFileName" TEXT NOT NULL, "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "paymentStatus" TEXT NOT NULL DEFAULT 'CREATED', "razorpayOrderId" TEXT, "razorpayPaymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentEvent" (
  "id" TEXT NOT NULL, "gatewayEventId" TEXT NOT NULL, "orderId" TEXT, "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL, "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");
CREATE UNIQUE INDEX "Order_razorpayPaymentId_key" ON "Order"("razorpayPaymentId");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_email_idx" ON "Order"("email");
CREATE UNIQUE INDEX "PaymentEvent_gatewayEventId_key" ON "PaymentEvent"("gatewayEventId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;