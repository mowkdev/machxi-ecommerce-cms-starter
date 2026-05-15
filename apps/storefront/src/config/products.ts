export type Product = {
  id: string
  handle: string
  name: string
  code: string
  category: string
  price: string
  tag?: { label: string; variant?: "default" | "accent" }
}

export const featuredProducts: Product[] = [
  {
    id: "saulrieta",
    handle: "saulrieta-spinings",
    name: "Saulrieta Spinings",
    code: "SAULRIETA · 9' 5wt",
    category: "Fly Rod · Hand-wrapped",
    price: "€189",
    tag: { label: "New", variant: "accent" },
  },
  {
    id: "ezera",
    handle: "ezera-spole",
    name: "Ezera Spole",
    code: "EZERA · SPOLE 04",
    category: "Reel · Machined alu",
    price: "€145",
  },
  {
    id: "lapsenes",
    handle: "lapsenes-musina",
    name: "Lapsenes Mušiņa",
    code: "LAPSENES MUŠIŅA · #14",
    category: "Dry fly · Tied to order",
    price: "€4.50",
  },
  {
    id: "putu",
    handle: "putu-vobleris",
    name: "Putu Vobleris",
    code: "PUTU VOBLERIS · 60mm",
    category: "Surface lure · Cedar & cork",
    price: "€12",
    tag: { label: "Last batch" },
  },
  {
    id: "vakara",
    handle: "vakara-aukla",
    name: "Vakara Aukla",
    code: "VAKARA AUKLA · WF6F",
    category: "Fly line · 30m, weight-forward",
    price: "€28",
  },
  {
    id: "klusais",
    handle: "klusais-metamais",
    name: "Klusais Metamais",
    code: "KLUSAIS METAMAIS · 7'6\"",
    category: "Spin rod · Travel four-piece",
    price: "€92",
  },
  {
    id: "roza",
    handle: "roza-box",
    name: "Roza Box",
    code: "ROZA HOOK CASE",
    category: "Tackle · Linden wood",
    price: "€34",
  },
  {
    id: "meza",
    handle: "meza-cepure",
    name: "Meža Cepure",
    code: "MEŽA CEPURE",
    category: "Wool cap · Oiled brim",
    price: "€48",
  },
]
