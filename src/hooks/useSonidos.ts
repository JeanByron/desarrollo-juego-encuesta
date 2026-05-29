import { useCallback } from "react";
import { useSonidoStore } from "@/store/useSonidoStore";

// =============================================================================
// Reproductor de efectos de sonido (SFX) para el juego.
//
//  - Sonidos con archivo en /public/sonidos/<nombre>.mp3 (acertado, fallado,
//    risa_acertada, pregunta_fallada) se reproducen desde el archivo.
//  - Cues genéricos de interfaz (clic, seleccion, etc.) se SINTETIZAN con la
//    Web Audio API, así suenan aunque no haya archivos.
//  - Volumen moderado para no molestar en el aula.
//  - Respeta la preferencia de "muteado" (useSonidoStore); al mutear se corta
//    cualquier sonido en curso.
//
// Los navegadores exigen un gesto del usuario para iniciar el audio; estos
// sonidos se disparan desde clics/botones, así que eso queda garantizado.
// =============================================================================

export type Sonido =
  | "clic"
  | "seleccion"
  | "exito"
  | "error"
  | "pato"
  | "inicio"
  | "acertado"
  | "risa_acertada"
  | "fallado"
  | "pregunta_fallada";

// Volumen general (0–1). Moderado a propósito.
const VOLUMEN = 0.4;

// Sonidos que existen como archivo en /public/sonidos/. El resto son cues de
// interfaz que se sintetizan (así evitamos pedir un .mp3 inexistente).
const CON_ARCHIVO: ReadonlySet<Sonido> = new Set<Sonido>([
  "acertado",
  "risa_acertada",
  "fallado",
  "pregunta_fallada"
]);

// --- Audios de archivo en curso, para poder cortarlos al mutear ---------------
const activos = new Set<HTMLAudioElement>();

function detenerTodo() {
  activos.forEach((a) => {
    a.pause();
    a.currentTime = 0;
  });
  activos.clear();
}

// Si el usuario activa el mute, cortamos lo que esté sonando.
useSonidoStore.subscribe((estado) => {
  if (estado.muteado) detenerTodo();
});

// --- Síntesis con Web Audio API (cues de interfaz sin archivo) ----------------
let ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tono(
  ac: AudioContext,
  freq: number,
  inicio: number,
  duracion: number,
  tipo: OscillatorType,
  volumen = 0.1
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, ac.currentTime + inicio);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + inicio);
  gain.gain.exponentialRampToValueAtTime(volumen * VOLUMEN * 2, ac.currentTime + inicio + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + inicio + duracion);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + inicio);
  osc.stop(ac.currentTime + inicio + duracion + 0.02);
}

function sintetizar(nombre: Sonido) {
  const ac = audioCtx();
  if (!ac) return;
  switch (nombre) {
    case "clic":
      tono(ac, 660, 0, 0.07, "triangle", 0.12);
      break;
    case "seleccion":
      tono(ac, 440, 0, 0.09, "square", 0.12);
      tono(ac, 880, 0.06, 0.12, "square", 0.12);
      break;
    case "exito":
      tono(ac, 523.25, 0, 0.14, "triangle");
      tono(ac, 659.25, 0.1, 0.14, "triangle");
      tono(ac, 783.99, 0.2, 0.22, "triangle");
      break;
    case "inicio":
      tono(ac, 392, 0, 0.12, "sawtooth", 0.14);
      tono(ac, 523.25, 0.12, 0.12, "sawtooth", 0.14);
      tono(ac, 659.25, 0.24, 0.26, "sawtooth", 0.14);
      break;
    case "error":
      tono(ac, 200, 0, 0.18, "sawtooth", 0.14);
      tono(ac, 140, 0.12, 0.22, "sawtooth", 0.14);
      break;
    case "pato":
      tono(ac, 300, 0, 0.12, "square", 0.16);
      tono(ac, 230, 0.1, 0.16, "square", 0.16);
      break;
    default:
      // Los sonidos con archivo no tienen síntesis de respaldo.
      break;
  }
}

// --- Reproducción de archivos -------------------------------------------------
// Reproduce un .mp3 con el volumen general y llama a `alTerminar` cuando acaba
// (o si no se puede reproducir), para poder encadenar secuencias.
function reproducirArchivo(nombre: Sonido, alTerminar?: () => void) {
  const audio = new Audio(`/sonidos/${nombre}.mp3`);
  audio.volume = VOLUMEN;
  activos.add(audio);

  let avanzado = false;
  const finalizar = () => {
    activos.delete(audio);
    if (!avanzado) {
      avanzado = true;
      alTerminar?.();
    }
  };

  audio.addEventListener("ended", finalizar, { once: true });
  audio.addEventListener("error", finalizar, { once: true });
  audio.play().catch(() => finalizar());
}

export function useSonidos() {
  // Reproduce un único sonido: desde archivo si lo tiene, si no lo sintetiza.
  const reproducir = useCallback((nombre: Sonido) => {
    if (useSonidoStore.getState().muteado) return;
    if (CON_ARCHIVO.has(nombre)) {
      reproducirArchivo(nombre);
    } else {
      sintetizar(nombre);
    }
  }, []);

  // Reproduce varios sonidos en secuencia: cada uno empieza al terminar el anterior.
  const reproducirSecuencia = useCallback((nombres: Sonido[]) => {
    if (useSonidoStore.getState().muteado) return;
    let i = 0;
    const siguiente = () => {
      if (useSonidoStore.getState().muteado) return; // por si se mutea a mitad
      if (i >= nombres.length) return;
      const nombre = nombres[i++];
      reproducirArchivo(nombre, siguiente);
    };
    siguiente();
  }, []);

  return { reproducir, reproducirSecuencia };
}
