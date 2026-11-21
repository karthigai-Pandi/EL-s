import Link from "next/link";
import { Check, MoveUpRight } from "lucide-react";
import { formatINR } from "@/lib/catalog";
import { serverApiUrl } from "@/lib/api";
import { StudioLogo } from "@/components/studio-logo";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  let order = null;
  try {
    const response = await fetch(serverApiUrl(`api/orders/${encodeURIComponent(orderNumber)}`), { cache: "no-store" });
    if (!response.ok) throw new Error("Order lookup failed.");
    const result = await response.json() as { order: { orderNumber: string; serviceName: string; totalPaise: number; status: string } };
    order = result.order;
  } catch {
    order = null;
  }

  return (
    <main className="confirmation-shell">
      <section className="confirmation">
        <Link className="brand-lockup" href="/" aria-label="EL's Studio home"><StudioLogo /></Link>
        {order ? <>
          <span className="confirmation-icon"><Check size={23} /></span>
          <p className="eyebrow">Order received</p>
          <h1>That&apos;s a good<br />start.</h1>
          <p>Your payment has been confirmed. We&apos;ll review the artwork and get in touch if anything needs a quick check before production.</p>
          <div className="confirmation-order"><span>Order reference</span><strong>{order.orderNumber}</strong></div>
          <div className="confirmation-order"><span>{order.serviceName} · {order.status.replaceAll("_", " ")}</span><strong>{formatINR(order.totalPaise / 100)}</strong></div>
          <Link className="nav-order" href="/">Back to the studio <MoveUpRight size={15} /></Link>
        </> : <>
          <p className="eyebrow not-found">Order lookup</p>
          <h1>We couldn&apos;t<br />find that order.</h1>
          <p>The reference may be incorrect, or payment confirmation is still processing. Check your payment status or contact the studio with your Razorpay receipt.</p>
          <Link className="nav-order" href="/">Back to the studio <MoveUpRight size={15} /></Link>
        </>}
      </section>
    </main>
  );
}