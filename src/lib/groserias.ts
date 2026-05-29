// =============================================================================
// Filtro de palabras obscenas (español + inglés) para los nombres de jugadores.
// No pretende ser exhaustivo, pero bloquea las groserías más comunes y algunos
// intentos de evasión (acentos, mayúsculas y "leet": 0→o, 1→i, 3→e, 4→a, …).
// =============================================================================

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s"
};

// Normaliza: minúsculas, sin acentos, leet→letras, solo letras y espacios.
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita los acentos (marcas combinantes)
    .replace(/[0-9@$]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z\s]/g, " ") // deja solo letras y espacios
    .replace(/\s+/g, " ")
    .trim();
}

// Groserías "fuertes": difícilmente aparecen dentro de un nombre real, así que
// se buscan como subcadena (atrapa variantes pegadas: "hijueputa", "putamadre").
const SUBCADENAS = [
  // Español
  "mierd", "cabron", "pendej", "gilipoll", "maricon", "hijuput", "hijoput",
  "hijodeput", "putamadre", "malparid", "chingad", "chinga", "pinche",
  "gonorrea", "verga", "mamaguevo", "mamahuevo", "mamawebo", "mamapinga",
  "culiao", "culer", "conchatumadre", "conchetumare", "reconchatumadre",
  "joputa", "huevon", "huevona", "guevon", "carajo", "cojones", "follar",
  "cojer", "jodete", "jodanse",
  // Español (Colombia)
  "chimba", "chimbo", "pirob", "caremonda", "caremondo", "carechimba",
  "careverga", "carepicha", "carechucha", "carehuevo", "carehueco",
  "malnacid", "jueputa", "granputa", "granperra", "malparida", "gamin",
  "rieputa", "carenalga", "lambon",
  // Inglés
  "fuck", "shit", "bullshit", "bitch", "asshole", "cunt", "whore", "faggot",
  "fagot", "nigger", "nigga", "nigg", "pussy", "dickhead", "bastard", "slut",
  "motherfuck", "wanker", "blowjob", "handjob", "jackass", "dumbass"
];

// Groserías "cortas": podrían aparecer dentro de nombres legítimos, así que se
// exigen como palabra completa (límites de palabra) para evitar falsos positivos.
const PALABRAS = [
  // Español
  "puta", "puto", "putas", "putos", "culo", "culos", "caca", "pene",
  "vagina", "teta", "tetas", "polla", "pollas", "pija", "perra", "zorra",
  "marica", "maricas", "cono", "concha", "mamon", "mamada", "pendeja",
  "cabrona", "sexo", "porno", "porn",
  // Español (Colombia)
  "monda", "mondas", "picha", "chucha", "hueva", "huevas", "gueva", "guevas",
  "nepe", "piroba", "pirobo", "chanda", "gonorrea", "guevon", "marihuanero",
  // Inglés
  "ass", "dick", "cock", "tit", "tits", "fag", "cum", "sex", "damn", "crap",
  "dildo", "boobs", "penis", "retard", "douche"
];

const REGEX_PALABRAS = new RegExp(`\\b(${PALABRAS.join("|")})\\b`);

// Devuelve true si el texto contiene alguna palabra obscena.
export function contieneGroseria(texto: string): boolean {
  const limpio = normalizar(texto);
  if (!limpio) return false;
  if (SUBCADENAS.some((mala) => limpio.includes(mala))) return true;
  return REGEX_PALABRAS.test(limpio);
}
