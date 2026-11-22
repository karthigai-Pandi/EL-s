export type ServiceView = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  ratePerSqft: number;
};

export type PortfolioView = {
  brand: string;
  title: string;
  category: string;
  summary: string;
  imageUrl: string;
};

export const fallbackServices: ServiceView[] = [
  { id: "vinyl", slug: "vinyl", name: "Vinyl printing", shortName: "Vinyl", description: "Vivid, durable vinyl graphics for storefronts, walls, vehicles and campaigns.", ratePerSqft: 85 },
  { id: "one-way-vision", slug: "one-way-vision", name: "One-way vision printing", shortName: "One-way vision", description: "Perforated window graphics that carry a clear campaign outside while preserving visibility from within.", ratePerSqft: 125 },
  { id: "uv", slug: "uv", name: "UV printing", shortName: "UV print", description: "Direct-to-surface UV prints with crisp detail and a premium finish on rigid substrates.", ratePerSqft: 240 },
  { id: "light-board", slug: "light-board", name: "Light board printing", shortName: "Light board", description: "Backlit films and display graphics designed for even illumination and strong retail visibility.", ratePerSqft: 165 },
  { id: "lamination", slug: "lamination", name: "Lamination", shortName: "Lamination", description: "Protective gloss, matte and textured overlamination to extend print life and refine its finish.", ratePerSqft: 35 },
  { id: "3d-printing", slug: "3d-printing", name: "3D printing", shortName: "3D print", description: "Custom printed dimensional letters, display forms and branded objects, quoted by projected area.", ratePerSqft: 520 },
  { id: "cutter", slug: "cutter", name: "Cutter services", shortName: "Cutter", description: "Precision contour cutting for decals, lettering, stencils and custom-shaped graphics.", ratePerSqft: 70 },
  { id: "exhibition-stall", slug: "exhibition-stall", name: "Exhibition stall design & build", shortName: "Exhibition stall", description: "Branded exhibition spaces planned, fabricated and installed for a confident show-floor presence.", ratePerSqft: 950 },
];

export const fallbackPortfolio: PortfolioView[] = [
  { brand: "Essilor", title: "A clearer kind of retail presence", category: "Retail graphics", summary: "A coordinated exhibition and retail presentation created for Essilor.", imageUrl: "/images/Essilor (1).png" },
  { brand: "Airtel", title: "Campaign colour, made visible", category: "Campaign printing", summary: "Campaign and display graphics developed for Airtel.", imageUrl: "/images/exhibition-graphics.svg" },
  { brand: "Lexar", title: "Product storytelling at the point of sale", category: "Display graphics", summary: "Retail display and branded presentation work for Lexar.", imageUrl: "/images/Lexar (1).png" },
  { brand: "Stall 1", title: "An exhibition space with presence", category: "Exhibition stall", summary: "Exhibition stall design and printed brand environment.", imageUrl: "/images/Stall 1 (1).jpeg" },
  { brand: "Stall 2", title: "A considered show-floor experience", category: "Exhibition stall", summary: "Exhibition stall planning, fabrication and visual graphics.", imageUrl: "/images/Stall 2 (1).jpeg" },
];

export const finishOptions = [
  { id: "standard", label: "Standard", multiplier: 1 },
  { id: "matte", label: "Matte finish", multiplier: 1.12 },
  { id: "gloss", label: "Gloss finish", multiplier: 1.12 },
  { id: "weatherproof", label: "Weatherproof", multiplier: 1.18 },
] as const;

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}