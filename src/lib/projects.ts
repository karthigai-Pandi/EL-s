export type ProjectDetail = {
  name: string;
  slug: string;
  category: string;
  intro: string;
  about: string[];
  mission: string;
  images: string[];
};

export const projectDetails: ProjectDetail[] = [
  {
    name: "Essilor",
    slug: "essilor",
    category: "Retail and exhibition graphics",
    intro: "Essilor — A Global Leader in Vision Care",
    about: [
      "Essilor is one of the world's leading names in ophthalmic lens technology, dedicated to improving people's vision and quality of life through continuous innovation and advanced optical solutions.",
      "Founded in France, Essilor has a long history of developing innovative lenses designed to meet different vision requirements. With a strong focus on research, technology and optical excellence, the company offers a wide range of solutions for everyday vision correction, visual comfort, eye protection and specialised vision needs.",
      "Today, Essilor is part of EssilorLuxottica, a global leader in vision care and eyewear, bringing together advanced lens technology, eyewear design and innovative optical solutions.",
    ],
    mission: "Its mission is to help people see better and experience the world with greater visual clarity and comfort.",
    images: Array.from({ length: 6 }, (_, index) => `/images/Essilor (${index + 1}).png`),
  },
  {
    name: "Airtel",
    slug: "airtel",
    category: "Campaign and display graphics",
    intro: "Airtel — Brand Presentation and Campaign Work",
    about: [
      "Airtel is a leading telecommunications brand delivering mobile, broadband and digital services.",
      "Content for the approved Airtel project description can be added here. This page structure is ready for verified project details, scope and outcomes.",
    ],
    mission: "Project mission and approved work summary — ready for client-provided details.",
    images: [],
  },
  {
    name: "Lexar",
    slug: "lexar",
    category: "Retail and display graphics",
    intro: "Lexar — Product and Retail Presentation",
    about: [
      "Lexar is known for storage and memory products designed for creators, professionals and everyday users.",
      "Content for the approved Lexar project description can be added here. This page structure is ready for verified project details, scope and outcomes.",
    ],
    mission: "Project mission and approved work summary — ready for client-provided details.",
    images: Array.from({ length: 4 }, (_, index) => `/images/Lexar (${index + 1}).png`),
  },
  {
    name: "Stall 1",
    slug: "stall-1",
    category: "Exhibition stall",
    intro: "Stall 1 — Exhibition Environment",
    about: [
      "A complete exhibition stall concept developed for clear brand communication, visitor flow and strong visual presence.",
      "Verified project scope, dimensions and completed work details can be added here.",
    ],
    mission: "Our work — ready for the client-approved project summary.",
    images: [1, 2, 3].flatMap((index) => [`/images/Stall 1 (${index}).jpeg`, `/images/Stall 1 (${index}).jpg`]),
  },
  {
    name: "Stall 2",
    slug: "stall-2",
    category: "Exhibition stall",
    intro: "Stall 2 — Exhibition Environment",
    about: [
      "A tailored exhibition stall experience combining graphics, structure and practical visitor interaction.",
      "Verified project scope, dimensions and completed work details can be added here.",
    ],
    mission: "Our work — ready for the client-approved project summary.",
    images: Array.from({ length: 10 }, (_, index) => `/images/Stall 2 (${index + 1}).jpeg`),
  },
];

