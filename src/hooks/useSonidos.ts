import { useCallback, useRef } from "react";

// Sencillo reproductor de SFX. Coloca los archivos en /public/sonidos/:
//   - exito.mp3   (campanita, "ding")
//   - pato.mp3    (cuack)
// El navegador exige interacción previa del usuario para reproducir audio,
// y como los botones de la profesora son los que disparan estos sonidos,
// eso ya está garantizado.
export function useSonidos() {
  const cacheExito = useRef<HTMLAudioElement | null>(null);
  const cachePato = useRef<HTMLAudioElement | null>(null);

  const reproducir = useCallback((nombre: "exito" | "pato") => {
    const ref = nombre === "exito" ? cacheExito : cachePato;
    if (!ref.current) {
      ref.current = new Audio(`/sonidos/${nombre}.mp3`);
      ref.current.preload = "auto";
    }
    ref.current.currentTime = 0;
    ref.current.play().catch(() => {
      // Ignoramos errores de reproducción (p.ej. el archivo aún no existe)
    });
  }, []);

  return { reproducir };
}
