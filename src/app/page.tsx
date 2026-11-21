import { fallbackPortfolio, fallbackServices, type PortfolioView, type ServiceView } from "@/lib/catalog";
import { serverApiUrl } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { OrderBuilder } from "@/components/order-builder";
import { StudioLogo } from "@/components/studio-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ArrowDownRight, ArrowUpRight, MoveUpRight } from "lucide-react";

async function getHomeData() {
  try {
    const [serviceResponse, portfolioResponse] = await Promise.all([
      fetch(serverApiUrl("api/services"), { next: { revalidate: 60 } }),
      fetch(serverApiUrl("api/portfolio"), { next: { revalidate: 300 } }),
    ]);
    if (!serviceResponse.ok || !portfolioResponse.ok) throw new Error("Catalog API unavailable.");
    const serviceData = await serviceResponse.json() as { services: ServiceView[] };
    const portfolioData = await portfolioResponse.json() as { items: Array<Omit<PortfolioView, "imageUrl"> & { imageUrl?: string | null }> };
    const projectViews: PortfolioView[] = portfolioData.items.map((project, index) => ({
      brand: project.brand,
      title: project.title,
      category: project.category,
      summary: project.summary,
      imageUrl: project.imageUrl ?? fallbackPortfolio[index % fallbackPortfolio.length].imageUrl,
    }));
    return { services: serviceData.services.length ? serviceData.services : fallbackServices, projects: projectViews.length ? projectViews : fallbackPortfolio };
  } catch {
    return { services: fallbackServices, projects: fallbackPortfolio };
  }
}

export default async function HomePage() {
  const { services, projects } = await getHomeData();

  return (
    <>
      <SiteHeader />
      <ScrollReveal />
      <main>
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> Print, place & presence</p>
            <h1>Make your<br /><em>mark</em> matter.</h1>
            <div className="hero-bottomline">
              <p>We turn good ideas into things people can see, touch and remember.</p>
              <a className="text-link" href="#order">Start an order <MoveUpRight size={16} /></a>
            </div>
            <div className="hero-stats">
              <div><strong>8</strong><span>print disciplines</span></div>
              <div><strong>1:1</strong><span>made for your brief</span></div>
              <div><strong>IN</strong><span>made close to home</span></div>
            </div>
          </div>
          <div className="hero-art" role="img" aria-label="EL's Studio vinyl campaign graphics applied to a storefront window">
            <div className="art-frame">
              <div className="art-photo" />
            </div>
            <div className="hero-stamp"><span>IDEA<br />TO<br />IMPACT</span><ArrowDownRight size={24} /></div>
          </div>
          <div className="hero-scroll"><ArrowDownRight size={15} /> Scroll to explore</div>
        </section>

        <section className="notice-band" aria-label="Studio notice" data-reveal>
          <strong>STUDIO NOTICE</strong>
          <p>Custom print orders are open. Rates shown are starting estimates and are confirmed against your final production brief.</p>
          <a href="#order">Configure a print <ArrowUpRight size={14} /></a>
        </section>

        <section className="intro-band" data-reveal>
          <p>One studio.<br /><span>Every surface.</span></p>
          <div><span className="intro-mark">E</span><p>From a single window graphic to a complete exhibition space, we bring practical craft and sharp production together under one roof.</p></div>
          <a href="#services" aria-label="Explore services"><ArrowDownRight size={23} /></a>
        </section>

        <section className="services-section section-pad" id="services" data-reveal>
          <div className="section-heading">
            <div><p className="eyebrow">01 / The latest</p><h2>Built to be<br /><em>seen.</em></h2></div>
            <p className="section-aside">The right material, the right finish, made to work in the real world.</p>
          </div>
          <div className="service-grid">
            {services.map((service, index) => (
              <a className="service-row" href="#order" key={service.slug}>
                <span className="service-index">0{index + 1}</span>
                <div><h3>{service.name}</h3><p>{service.description}</p></div>
                <span className="service-rate">{formatServiceRate(service.ratePerSqft)}<small> / sq ft</small></span>
                <span className="service-arrow"><ArrowUpRight size={18} /></span>
              </a>
            ))}
          </div>
        </section>

        <section className="order-section" id="order" data-reveal>
          <div className="order-intro">
            <p className="eyebrow">02 / Your print, priced</p>
            <h2>Good work<br />starts <em>here.</em></h2>
            <p>Choose your service, add dimensions and see your estimate update as you go. Artwork stays private and your payment is handled securely.</p>
            <div className="order-note"><span>01</span><p>Per-square-foot rates are starting estimates. Unusual materials or installation needs can be confirmed before production.</p></div>
          </div>
          <OrderBuilder services={services} />
        </section>

        <section className="work-section section-pad" id="work" data-reveal>
          <div className="section-heading work-heading">
            <div><p className="eyebrow">03 / Selected thinking</p><h2>Made to make<br /><em>an impression.</em></h2></div>
            <p className="section-aside">A glimpse of the kinds of brand worlds we help bring to life.</p>
          </div>
          <div className="work-grid">
            {projects.map((project, index) => (
              <article className={`work-card work-card-${index + 1}`} key={project.brand}>
                <div className="work-image" role="img" aria-label={`${project.category} concept: ${project.title}`} style={{ backgroundImage: `url("${project.imageUrl}")` }}>
                  <span className="work-number">0{index + 1}</span>
                  <span className="work-chip">Representative concept</span>
                  <span className="work-wordmark">{project.brand}</span>
                </div>
                <div className="work-info"><div><p className="eyebrow">{project.category}</p><h3>{project.title}</h3><p>{project.summary}</p></div><ArrowUpRight size={19} /></div>
              </article>
            ))}
          </div>
          <p className="work-disclaimer">Brand names are shown for illustrative case-study placeholders only. No endorsement or completed project is implied; replace with approved client references before launch.</p>
        </section>

        <section className="process-band" id="process" data-reveal>
          <div className="process-title"><p className="eyebrow">04 / From brief to wall</p><h2>Made with<br /><em>intention.</em></h2></div>
          <div className="process-steps">
            <div><span>01</span><h3>Tell us the shape</h3><p>Choose a service, enter dimensions and share your artwork.</p></div>
            <div><span>02</span><h3>We get it ready</h3><p>Our team checks the brief and confirms any production details.</p></div>
            <div><span>03</span><h3>Out into the world</h3><p>Pay securely, then choose collection or delivery for your finished work.</p></div>
          </div>
        </section>

        <footer className="site-footer" id="contact">
          <div className="footer-top"><a className="brand-lockup footer-brand" href="#top" aria-label="EL's Studio home"><StudioLogo light /></a><p>Print with purpose.<br />Make it count.</p><a className="footer-contact" href="mailto:hello@elsstudio.in">hello@elsstudio.in <MoveUpRight size={16} /></a></div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} EL&apos;s Studio</span><span>Made with care in India</span><a href="#top">Back to top ↑</a><a href="/admin">Studio admin</a></div>
        </footer>
      </main>
    </>
  );
}

function formatServiceRate(rate: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(rate);
}