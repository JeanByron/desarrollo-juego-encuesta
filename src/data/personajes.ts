// =============================================================================
// Catálogo de personajes inspirados en Los Simpson.
// `id` se guarda en jugadores.avatar (Postgres). NO renombrar ids ya en uso,
// porque rompería el constraint unique(partida_id, avatar) de partidas pasadas.
// La imagen vive en /public/personajes/<id>.png (servida estática por Vite).
// =============================================================================

export interface Personaje {
  id: string;
  nombre: string;
  emoji: string;            // fallback si la imagen no carga
  imagen: string;           // ruta pública (PNG con fondo transparente)
  color: string;            // tailwind bg-... (acento/borde del personaje)
}

export const PERSONAJES: Personaje[] = [
  { id: "homero",   nombre: "Homero",   emoji: "🍩", imagen: "/personajes/homero.png",   color: "bg-marca-amarillo" },
  { id: "marge",    nombre: "Marge",    emoji: "💙", imagen: "/personajes/marge.png",    color: "bg-marca-azul" },
  { id: "bart",     nombre: "Bart",     emoji: "🛹", imagen: "/personajes/bart.png",     color: "bg-marca-rojo" },
  { id: "lisa",     nombre: "Lisa",     emoji: "🎷", imagen: "/personajes/lisa.png",     color: "bg-marca-amarillo" },
  { id: "maggie",   nombre: "Maggie",   emoji: "🍼", imagen: "/personajes/maggie.png",   color: "bg-marca-rosado" },
  { id: "milhouse", nombre: "Milhouse", emoji: "🤓", imagen: "/personajes/milhouse.png", color: "bg-marca-morado" },
  { id: "nelson",   nombre: "Nelson",   emoji: "😤", imagen: "/personajes/nelson.png",   color: "bg-marca-rojo" },
  { id: "moe",      nombre: "Moe",      emoji: "🍺", imagen: "/personajes/moe.png",      color: "bg-marca-verde" },
  { id: "apu",      nombre: "Apu",      emoji: "🛒", imagen: "/personajes/apu.png",      color: "bg-marca-morado" },
  { id: "krusty",   nombre: "Krusty",   emoji: "🤡", imagen: "/personajes/krusty.png",   color: "bg-marca-rosado" },
  { id: "flanders", nombre: "Flanders", emoji: "🙏", imagen: "/personajes/flanders.png", color: "bg-marca-verde" },
  { id: "burns",         nombre: "Sr. Burns",       emoji: "💰", imagen: "/personajes/burns.png",              color: "bg-marca-morado" },
  { id: "grandma_flanders", nombre: "Abuela Flanders", emoji: "👵", imagen: "/personajes/grandma_flanders.png", color: "bg-marca-azul"    },
  { id: "selma",         nombre: "Selma",           emoji: "🚬", imagen: "/personajes/selma.png",            color: "bg-marca-rojo"    },
  { id: "sideshow_bob",  nombre: "Sideshow Bob",    emoji: "🎭", imagen: "/personajes/sideshow_bob.png",     color: "bg-marca-verde"   },
  { id: "ralph",         nombre: "Ralph Wiggum",    emoji: "🌟", imagen: "/personajes/ralph.png",            color: "bg-marca-rosado"  },
  { id: "abuelo",        nombre: "Abuelo Simpson",  emoji: "👴", imagen: "/personajes/abuelo.png",           color: "bg-marca-azul"    },
  { id: "ayudante_santa", nombre: "Ayudante de Santa", emoji: "🐕", imagen: "/personajes/ayudante_santa.png", color: "bg-marca-rojo"   },
  { id: "bleeding_gums", nombre: "Bleeding Gums",   emoji: "🎷", imagen: "/personajes/bleeding_gums.png",    color: "bg-marca-morado"  },
  { id: "wiggum",        nombre: "Jefe Wiggum",     emoji: "👮", imagen: "/personajes/wiggum.png",           color: "bg-marca-azul"    },
  { id: "loca_gatos",    nombre: "Loca de los Gatos", emoji: "🐱", imagen: "/personajes/loca_gatos.png",     color: "bg-marca-verde"   },
  { id: "skinner",       nombre: "Director Skinner", emoji: "🎓", imagen: "/personajes/skinner.png",         color: "bg-marca-amarillo" },
  { id: "edna",          nombre: "Edna Krabappel",  emoji: "🍎", imagen: "/personajes/edna.png",             color: "bg-marca-rosado"  },
  { id: "hibbert",       nombre: "Dr. Hibbert",     emoji: "🩺", imagen: "/personajes/hibbert.png",          color: "bg-marca-verde"   }
];

export function buscarPersonaje(id: string): Personaje | undefined {
  return PERSONAJES.find((p) => p.id === id);
}
