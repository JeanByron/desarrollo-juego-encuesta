// =============================================================================
// Catálogo de personajes inspirados en Los Simpson.
// Usamos un emoji como representación visual sencilla. Si más adelante quieres
// imágenes propias, basta con cambiar el campo `emoji` por `imagen: string`
// y guardarlas en /public/personajes/<id>.png.
// =============================================================================

export interface Personaje {
  id: string;       // se guarda en la columna jugadores.avatar
  nombre: string;
  emoji: string;
  color: string;    // tailwind bg-... para la tarjeta
}

export const PERSONAJES: Personaje[] = [
  { id: "homero",   nombre: "Homero",   emoji: "🍩", color: "bg-marca-amarillo" },
  { id: "marge",    nombre: "Marge",    emoji: "💙", color: "bg-marca-azul" },
  { id: "bart",     nombre: "Bart",     emoji: "🛹", color: "bg-marca-rojo" },
  { id: "lisa",     nombre: "Lisa",     emoji: "🎷", color: "bg-marca-amarillo" },
  { id: "maggie",   nombre: "Maggie",   emoji: "🍼", color: "bg-marca-rosado" },
  { id: "milhouse", nombre: "Milhouse", emoji: "🤓", color: "bg-marca-morado" },
  { id: "nelson",   nombre: "Nelson",   emoji: "😤", color: "bg-marca-rojo" },
  { id: "moe",      nombre: "Moe",      emoji: "🍺", color: "bg-marca-verde" },
  { id: "apu",      nombre: "Apu",      emoji: "🛒", color: "bg-marca-morado" },
  { id: "krusty",   nombre: "Krusty",   emoji: "🤡", color: "bg-marca-rosado" }
];

export function buscarPersonaje(id: string): Personaje | undefined {
  return PERSONAJES.find((p) => p.id === id);
}
