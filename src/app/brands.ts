export const BRANDS = [
  "ALFA",
  "CRYSTAL",
  "MARVEL",
  "VISTA",
  "SONATA",
  "RIO",
  "SILK",
  "PRIME",
  "TERIM",
  "NEXA",
  "FIGO",
  "FUSION",
  "GARNET",
  "CLASSIC",
  "TURBO",
] as const;

export type Brand = (typeof BRANDS)[number];
