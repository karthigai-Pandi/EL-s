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
  { brand: "Studio study 01", title: "Colour that stays in view", category: "Vinyl printing", summary: "An illustrative vinyl campaign concept using layered colour and durable large-format graphics.", imageUrl: "/images/vinyl-print.svg" },
  { brand: "Studio study 02", title: "A window becomes a canvas", category: "One-way vision", summary: "An illustrative perforated-film concept that balances street-facing graphics with inside visibility.", imageUrl: "/images/one-way-vision.svg" },
  { brand: "Studio study 03", title: "A stand with a point of view", category: "Exhibition graphics", summary: "An illustrative exhibition environment showing how printed panels can shape a brand space.", imageUrl: "/images/exhibition-graphics.svg" },
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