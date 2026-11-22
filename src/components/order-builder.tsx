"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, FileUp, LoaderCircle, LockKeyhole, Plus, Minus, ShieldCheck } from "lucide-react";
import { finishOptions, formatINR, type ServiceView } from "@/lib/catalog";
import { clientApiUrl } from "@/lib/api";

type UploadMeta = { key: string; name: string };
type CheckoutPayload = { key: string; orderNumber: string; razorpayOrderId: string; amount: number; currency: "INR" };

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void }; }
}

const allowedExtensions = ["pdf", "ai", "png", "jpg", "jpeg"];
const maxFileSize = 25 * 1024 * 1024;

export function OrderBuilder({ services }: { services: ServiceView[] }) {
  const router = useRouter();
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? "vinyl");
  const [width, setWidth] = useState("3");
  const [widthIn, setWidthIn] = useState("0");
  const [height, setHeight] = useState("2");
  const [heightIn, setHeightIn] = useState("0");
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState<(typeof finishOptions)[number]["id"]>("standard");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", fulfillment: "delivery", address: "", notes: "" });

  const selectedService = services.find((service) => service.slug === serviceSlug) ?? services[0];
  const selectedFinish = finishOptions.find((option) => option.id === finish) ?? finishOptions[0];
  const widthFeet = Number(width) || 0;
  const widthInches = Number(widthIn) || 0;
  const heightFeet = Number(height) || 0;
  const heightInches = Number(heightIn) || 0;
  const widthValue = widthFeet + widthInches / 12;
  const heightValue = heightFeet + heightInches / 12;
  const area = widthValue * heightValue;
  const total = useMemo(() => (selectedService?.ratePerSqft ?? 0) * area * quantity * selectedFinish.multiplier, [selectedService, area, quantity, selectedFinish]);

  function updateCustomer(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFileError("");
    setFile(nextFile);
    if (!nextFile) return;
    const extension = nextFile.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension)) {
      setFileError("Choose a PDF, AI, PNG or JPG artwork file.");
      setFile(null);
    } else if (nextFile.size > maxFileSize) {
      setFileError("Files must be 25 MB or smaller.");
      setFile(null);
    }
  }

  async function getRazorpay() {
    if (window.Razorpay) return window.Razorpay;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-razorpay]");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Payment checkout could not load.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.dataset.razorpay = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Payment checkout could not load."));
      document.body.appendChild(script);
    });
    if (!window.Razorpay) throw new Error("Payment checkout is unavailable.");
    return window.Razorpay;
  }

  async function uploadArtwork(): Promise<UploadMeta> {
    if (!file) throw new Error("Add your artwork file to continue.");
    const presignResponse = await fetch(clientApiUrl("api/uploads/presign"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream", fileSize: file.size }),
    });
    const presign = await presignResponse.json();
    if (!presignResponse.ok) throw new Error(presign.error ?? "Could not prepare your artwork upload.");
    const uploadResponse = await fetch(presign.uploadUrl, { method: "PUT", headers: { "Content-Type": presign.contentType }, body: file });
    if (!uploadResponse.ok) throw new Error("Your artwork did not finish uploading. Please try again.");
    return { key: presign.key, name: file.name };
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!selectedService || area <= 0) throw new Error("Enter a width and height greater than zero.");
      const artwork = await uploadArtwork();
      const orderResponse = await fetch(clientApiUrl("api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug, widthFt: widthValue, heightFt: heightValue,
          widthFeet, widthInches, heightFeet, heightInches, quantity, finish,
          customerName: customer.name, phone: customer.phone, email: customer.email,
          fulfillment: customer.fulfillment, address: customer.fulfillment === "delivery" ? customer.address : "",
          notes: customer.notes, designFileKey: artwork.key, designFileName: artwork.name,
        }),
      });
      const order: CheckoutPayload & { error?: string } = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error ?? "We could not create your order.");
      const Razorpay = await getRazorpay();
      const checkout = new Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "EL's Studio",
        description: `${selectedService.shortName} · ${area.toFixed(2)} sq ft × ${quantity}`,
        order_id: order.razorpayOrderId,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: "#f15d3e" },
        handler: async (response) => {
          try {
            const verify = await fetch(clientApiUrl("api/payments/verify"), {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderNumber: order.orderNumber, ...response }),
            });
            const result = await verify.json();
            if (!verify.ok) throw new Error(result.error ?? "Payment verification is still processing.");
            router.push(`/order/${order.orderNumber}`);
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Payment confirmation is still processing. Your order will update shortly.");
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on("payment.failed", (response) => {
        setMessage(response.error?.description ?? "Payment did not go through. You can try again.");
        setBusy(false);
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form className="order-builder" onSubmit={submitOrder}>
      <div className="builder-topline"><span>PRINT ORDER</span><span><span className="status-dot" /> INDIAN RUPEES · INR</span></div>
      <div className="builder-fields">
        <label className="field-label" htmlFor="service">01 <span>Choose a service</span></label>
        <div className="select-wrap"><select id="service" value={serviceSlug} onChange={(event) => setServiceSlug(event.target.value)}>{services.map((service) => <option value={service.slug} key={service.slug}>{service.name}</option>)}</select><ChevronDown size={17} /></div>
        {selectedService && <p className="field-hint">{selectedService.description}</p>}

        <label className="field-label dimensions-label">02 <span>Size</span><small>width × height</small></label>
        <div className="dimension-grid">
          <label><span>Width Ft</span><div className="input-unit"><input aria-label="Width in feet" type="number" min="0" max="1000" step="1" value={width} onChange={(event) => setWidth(event.target.value)} required /><small>ft</small></div></label>
          <label><span>Width Inch</span><div className="input-unit"><input aria-label="Width in inches" type="number" min="0" max="11.99" step="0.01" value={widthIn} onChange={(event) => setWidthIn(event.target.value)} required /><small>in</small></div></label>
          <span className="dimension-times">×</span>
          <label><span>Height Ft</span><div className="input-unit"><input aria-label="Height in feet" type="number" min="0" max="1000" step="1" value={height} onChange={(event) => setHeight(event.target.value)} required /><small>ft</small></div></label>
          <label><span>Height Inch</span><div className="input-unit"><input aria-label="Height in inches" type="number" min="0" max="11.99" step="0.01" value={heightIn} onChange={(event) => setHeightIn(event.target.value)} required /><small>in</small></div></label>
          <div className="quantity-control"><span>Qty</span><div><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={13} /></button><strong>{quantity}</strong><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(500, quantity + 1))}><Plus size={13} /></button></div></div>
        </div>
        <div className="area-inline"><span>Calculated area</span><strong>{area.toFixed(2)} sq ft <small>× {quantity} {quantity === 1 ? "copy" : "copies"}</small></strong></div>

        <label className="field-label finish-label" htmlFor="finish">03 <span>Material / finish</span></label>
        <div className="select-wrap"><select id="finish" value={finish} onChange={(event) => setFinish(event.target.value as typeof finish)}>{finishOptions.map((option) => <option value={option.id} key={option.id}>{option.label}{option.multiplier > 1 ? ` · +${Math.round((option.multiplier - 1) * 100)}%` : ""}</option>)}</select><ChevronDown size={17} /></div>

        <label className="field-label upload-label" htmlFor="artwork">04 <span>Upload your artwork</span><small>PDF, AI, PNG, JPG · up to 25 MB</small></label>
        <label className={`upload-drop ${file ? "has-file" : ""}`} htmlFor="artwork">
          {file ? <Check size={19} /> : <FileUp size={19} />}
          <span>{file ? file.name : "Choose a file or drop it here"}<small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ready to upload` : "Artwork is transferred over an encrypted connection"}</small></span>
          <input id="artwork" type="file" accept=".pdf,.ai,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={chooseFile} />
        </label>
        {fileError && <p className="form-error" role="alert">{fileError}</p>}

        <label className="field-label customer-label">05 <span>Your details</span></label>
        <div className="customer-grid">
          <label className="text-field"><span>Full name</span><input name="name" autoComplete="name" value={customer.name} onChange={updateCustomer} required maxLength={100} /></label>
          <label className="text-field"><span>Phone number</span><input name="phone" type="tel" autoComplete="tel" value={customer.phone} onChange={updateCustomer} required maxLength={20} placeholder="+91" /></label>
          <label className="text-field field-wide"><span>Email address</span><input name="email" type="email" autoComplete="email" value={customer.email} onChange={updateCustomer} required maxLength={254} /></label>
          <label className="text-field"><span>Fulfilment</span><select name="fulfillment" value={customer.fulfillment} onChange={updateCustomer}><option value="delivery">Deliver to me</option><option value="pickup">I&apos;ll collect</option></select></label>
          {customer.fulfillment === "delivery" && <label className="text-field"><span>Delivery address</span><input name="address" autoComplete="street-address" value={customer.address} onChange={updateCustomer} required maxLength={300} /></label>}
          <label className="text-field field-wide"><span>Anything we should know? <small>optional</small></span><textarea name="notes" rows={2} value={customer.notes} onChange={updateCustomer} maxLength={1000} placeholder="Substrate, deadline, installation details…" /></label>
        </div>
      </div>

      <div className="price-summary">
        <div><span>Rate / sq ft</span><strong>{formatINR(selectedService?.ratePerSqft ?? 0)}</strong></div>
        <div><span>Area × quantity</span><strong>{(area * quantity).toFixed(2)} sq ft</strong></div>
        {selectedFinish.multiplier > 1 && <div><span>{selectedFinish.label}</span><strong>+{Math.round((selectedFinish.multiplier - 1) * 100)}%</strong></div>}
        <div className="summary-total"><span>Estimated total <small>incl. finish</small></span><strong>{formatINR(total)}</strong></div>
        <p>Taxes and delivery, if applicable, are confirmed before production.</p>
      </div>
      {message && <p className="form-error checkout-message" role="alert">{message}</p>}
      <button className="pay-button" type="submit" disabled={busy || !file || !selectedService || total <= 0}>
        {busy ? <><LoaderCircle className="spin" size={17} /> Preparing secure checkout…</> : <>Continue to payment <span>{formatINR(total)}</span></>}
      </button>
      <p className="payment-trust"><LockKeyhole size={13} /> Secure checkout via Razorpay <span>·</span> UPI <span>·</span> RuPay <span>·</span> Cards <span>·</span> Net banking</p>
      <div className="payment-footnote"><ShieldCheck size={14} /><span>Final production starts after artwork review and payment confirmation.</span></div>
    </form>
  );
}