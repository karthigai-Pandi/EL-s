import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { projectDetails } from "@/lib/projects";

export function generateStaticParams() {
  return projectDetails.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projectDetails.find((item) => item.slug === slug);
  return { title: project ? `${project.name} | EL's Studio` : "Project | EL's Studio" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectDetails.find((item) => item.slug === slug);
  if (!project) notFound();

  return (
    <>
      <SiteHeader />
      <main className="project-page">
        <section className="project-hero">
          <Link className="project-back" href="/#work"><ArrowLeft size={15} /> Back to selected work</Link>
          <p className="eyebrow">{project.category}</p>
          <h1>{project.name}</h1>
          <p className="project-intro">{project.intro}</p>
          <Link className="project-quote" href="/#order">Start a similar project <ArrowUpRight size={16} /></Link>
        </section>

        <section className="project-about">
          <div>
            <p className="eyebrow">Company and project</p>
            <h2>{project.name === "Essilor" ? "About Essilor – A Global Leader in Vision Care" : `About ${project.name}`}</h2>
          </div>
          <div className="project-copy">
            {project.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="project-mission">{project.mission}</p>
          </div>
        </section>

        <section className="project-gallery" aria-label={`${project.name} project images`}>
          {project.images.length ? project.images.map((image, index) => (
            <figure key={image} className={`project-image project-image-${index + 1}`}>
              <img src={image} alt={`${project.name} project work ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} />
            </figure>
          )) : (
            <div className="project-placeholder">
              <p className="eyebrow">Images needed</p>
              <h3>Add Airtel project images here</h3>
              <p>The page structure is complete. Approved Airtel photographs and project details can replace this placeholder.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
