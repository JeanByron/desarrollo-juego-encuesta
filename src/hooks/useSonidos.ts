import { useCallback } from "react";

// =============================================================================
// Reproductor de efectos de sonido (SFX) para el juego.
//
// Estrategia en dos capas:
//   1) Si existe un archivo en /public/sonidos/<nombre>.mp3, se reproduce ese
//      (la profesora puede personalizarlos: exito.mp3, pato.mp3, etc.).
//   2) Si no existe (o falla), se SINTETIZA el sonido con la Web Audio API,
//      así el juego SIEMPRE suena sin necesidad de subir archivos.
//
// Los navegadores exigen un gesto del usuario para iniciar el audio; como estos
// sonidos se disparan desde clics/botones, eso queda garantizado.
// =============================================================================

export type Sonido = "clic" | "seleccion" | "exito" | "error" | "pato" | "inicio";

// AudioContext único y perezoso (se crea en el primer gesto del usuario).
let ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Reproduce un tono simple (oscilador + envolvente) para construir melodías.
function tono(
  ac: AudioContext,
  freq: number,
  inicio: number,
  duracion: number,
  tipo: OscillatorType,
  volumen = 0.18
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, ac.currentTime + inicio);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + inicio);
  gain.gain.exponentialRampToValueAtTime(volumen, ac.currentTime + inicio + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + inicio + duracion);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + inicio);
  osc.stop(ac.currentTime + inicio + duracion + 0.02);
}

// Sonido sintetizado por tipo de evento.
function sintetizar(nombre: Sonido) {
  const ac = audioCtx();
  if (!ac) return;
  switch (nombre) {
    case "clic":
      tono(ac, 660, 0, 0.07, "triangle", 0.12);
      break;
    case "seleccion": // "boing" alegre ascendente
      tono(ac, 440, 0, 0.09, "square", 0.12);
      tono(ac, 880, 0.06, 0.12, "square", 0.12);
      break;
    case "exito": // arpegio mayor (ding alegre)
      tono(ac, 523.25, 0, 0.14, "triangle"); // Do
      tono(ac, 659.25, 0.1, 0.14, "triangle"); // Mi
      tono(ac, 783.99, 0.2, 0.22, "triangle"); // Sol
      break;
    case "inicio": // fanfarria corta
      tono(ac, 392, 0, 0.12, "sawtooth", 0.14); // Sol
      tono(ac, 523.25, 0.12, 0.12, "sawtooth", 0.14); // Do
      tono(ac, 659.25, 0.24, 0.26, "sawtooth", 0.14); // Mi
      break;
    case "error": // descenso "buzz"
      tono(ac, 200, 0, 0.18, "sawtooth", 0.14);
      tono(ac, 140, 0.12, 0.22, "sawtooth", 0.14);
      break;
    case "pato": // graznido juguetón
      tono(ac, 300, 0, 0.12, "square", 0.16);
      tono(ac, 230, 0.1, 0.16, "square", 0.16);
      break;
  }
}

// Cache de elementos de audio para los mp3 opcionales.
const cacheMp3: Partial<Record<Sonido, HTMLAudioElement | "ausente">> = {};

export function useSonidos() {
  const reproducir = useCallback((nombre: Sonido) => {
    const entrada = cacheMp3[nombre];

    // Ya sabemos que no hay archivo → sintetizar directo.
    if (entrada === "ausente") {
      sintetizar(nombre);
      return;
    }

    if (!entrada) {
      const audio = new Audio(`/sonidos/${nombre}.mp3`);
      audio.preload = "auto";
      // Si el archivo no existe, marcamos "ausente" y usamos síntesis a partir de ahora.
      audio.addEventListener("error", () => {
        cacheMp3[nombre] = "ausente";
      });
      cacheMp3[nombre] = audio;
    }

    const audio = cacheMp3[nombre] as HTMLAudioElement;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // No se pudo (archivo ausente o bloqueado): caer a sonido sintetizado.
      cacheMp3[nombre] = "ausente";
      sintetizar(nombre);
    });
  }, []);

  return { reproducir };
}
