"use client";

import { useState } from "react";
import { ArrowLeft, LoaderCircle, LockKeyhole, LogOut, RefreshCw, Save } from "lucide-react";
import { formatINR } from "@/lib/catalog";
import { clientApiUrl } from "@/lib/api";
import Link from "next/link";
import { StudioLogo } from "@/components/studio-logo";

type AdminOrder = {
  id: string;
  orderNumber: string;
  serviceName: string;
  areaSqft: number;
  quantity: number;
  totalPaise: number;
  customerName: string;
  phone: string;
  email: string;
  fulfillment: string;
  address: string | null;
  designFileKey: string;
  designFileName: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

type AdminService = { slug: string; name: string; ratePerSqft: number; active: boolean };
const orderStatuses = ["PENDING_PAYMENT", "PAID", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED", "PAYMENT_FAILED"];

export function AdminDashboard() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [orderResponse, serviceResponse] = await Promise.all([
        fetch(clientApiUrl("api/admin/orders"), { headers, cache: "no-store" }),
        fetch(clientApiUrl("api/admin/services"), { headers, cache: "no-store" }),
      ]);
      const [orderData, serviceData] = await Promise.all([orderResponse.json(), serviceResponse.json()]);
      if (!orderResponse.ok || !serviceResponse.ok) throw new Error(orderData.error ?? serviceData.error ?? "Dashboard access was denied.");
      setOrders(orderData.orders);
      setServices(serviceData.services);
      setRates(Object.fromEntries(serviceData.services.map((service: AdminService) => [service.slug, String(service.ratePerSqft)])));
      setAuthenticated(true);
    } catch (loadError) {
      setAuthenticated(false);
      setError(loadError instanceof Error ? loadError.message : "Could not open the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderNumber: string, status: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(clientApiUrl("api/admin/orders"), {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOrders((current) => current.map((order) => order.orderNumber === orderNumber ? { ...order, status } : order));
      setNotice(`${orderNumber} updated.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Order status could not be updated.");
    }
  }

  async function updateRate(service: AdminService) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(clientApiUrl("api/admin/services"), {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ slug: service.slug, ratePerSqft: Number(rates[service.slug]) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setServices((current) => current.map((item) => item.slug === service.slug ? { ...item, ratePerSqft: result.service.ratePerSqft } : item));
      setNotice(`${service.name} rate saved.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Rate could not be updated.");
    }
  }

  async function openArtwork(key: string) {
    setError("");
    try {
      const response = await fetch(clientApiUrl("api/admin/artwork"), {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Artwork could not be opened.");
    }
  }

  function signOut() {
    setToken("");
    setAuthenticated(false);
    setOrders([]);
    setServices([]);
  }

  if (!authenticated) {
    return (
      <main className="admin-login-shell">
        <form className="admin-login" onSubmit={(event) => { event.preventDefault(); void loadDashboard(); }}>
          <Link className="brand-lockup" href="/" aria-label="EL's Studio home"><StudioLogo /></Link>
          <p className="eyebrow">Studio operations</p><h1>Good work,<br /><em>in progress.</em></h1>
          <p className="admin-intro">Sign in to manage incoming print orders and current service rates.</p>
          <label htmlFor="admin-token">Admin access token</label>
          <input id="admin-token" type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} required />
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading || !token}>{loading ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={15} />} Open dashboard</button>
          <Link className="admin-back" href="/">← Back to studio</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header"><Link className="brand-lockup" href="/" aria-label="EL's Studio home"><StudioLogo light /></Link><span className="admin-header-label">OPERATIONS / 01</span><div><button onClick={() => void loadDashboard()} title="Refresh orders" aria-label="Refresh orders"><RefreshCw size={17} /></button><button onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div></header>
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="eyebrow">Studio operations</p><h1>Orders & rates</h1></div><Link href="/" className="admin-back"><ArrowLeft size={14} /> View storefront</Link></div>
        {error && <p className="admin-alert" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
        <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">01 / Fulfilment</p><h2>Recent orders <span>{orders.length}</span></h2></div></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Print</th><th>Total</th><th>Artwork</th><th>Status</th></tr></thead><tbody>
            {orders.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></td><td>{order.customerName}<small><a href={`mailto:${order.email}`}>{order.email}</a> · {order.phone}</small>{order.fulfillment === "delivery" && order.address && <small>{order.address}</small>}</td><td>{order.serviceName}<small>{order.areaSqft.toFixed(2)} sq ft × {order.quantity}</small></td><td>{formatINR(order.totalPaise / 100)}<small>{order.paymentStatus}</small></td><td><button className="artwork-link" onClick={() => void openArtwork(order.designFileKey)}>{order.designFileName} ↗</button></td><td><select aria-label={`Status for ${order.orderNumber}`} value={order.status} onChange={(event) => void updateStatus(order.orderNumber, event.target.value)}>{orderStatuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></td></tr>)}
            {!orders.length && <tr><td className="admin-empty" colSpan={6}>No print orders yet.</td></tr>}
          </tbody></table></div>
        </section>
        <section className="admin-panel rates-panel"><div className="admin-panel-heading"><div><p className="eyebrow">02 / Pricing</p><h2>Service rates <span>INR / sq ft</span></h2></div></div>
          <div className="rate-grid">{services.map((service) => <form key={service.slug} onSubmit={(event) => { event.preventDefault(); void updateRate(service); }}><label htmlFor={`rate-${service.slug}`}>{service.name}</label><div><span>₹</span><input id={`rate-${service.slug}`} type="number" min="1" max="100000" step="1" value={rates[service.slug] ?? ""} onChange={(event) => setRates((current) => ({ ...current, [service.slug]: event.target.value }))} required /><button type="submit" aria-label={`Save ${service.name} rate`} title="Save rate"><Save size={15} /></button></div></form>)}</div>
        </section>
        <p className="admin-security"><LockKeyhole size={13} /> Admin token is held only in this page&apos;s memory and sent over HTTPS to protected API routes.</p>
      </section>
    </main>
  );
}