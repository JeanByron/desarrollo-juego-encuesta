import { useEffect, useRef } from "react";
import { useSonidoStore } from "@/store/useSonidoStore";

// Música de fondo en bucle a bajo volumen. Se monta una sola vez (en App) para
// que siga sonando entre pantallas. Respeta la preferencia de mute.
// Los navegadores bloquean el autoplay sin gesto del usuario, así que si el
// primer intento falla, arranca en el primer clic/tecla.
const VOLUMEN_MUSICA = 0.1;

export function MusicaFondo() {
  const muteado = useSonidoStore((s) => s.muteado);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/sonidos/musica_fondo.mp3");
    audio.loop = true;
    audio.volume = VOLUMEN_MUSICA;
    audio.preload = "auto";
    audioRef.current = audio;

    const intentar = () => {
      if (useSonidoStore.getState().muteado) return;
      audio.play().catch(() => {});
    };

    // Intento inmediato (puede fallar por política de autoplay).
    intentar();

    // Reintento al primer gesto; al lograrlo, quitamos los listeners.
    const alGesto = () => {
      if (useSonidoStore.getState().muteado) return;
      audio
        .play()
        .then(() => {
          window.removeEventListener("pointerdown", alGesto);
          window.removeEventListener("keydown", alGesto);
        })
        .catch(() => {});
    };
    window.addEventListener("pointerdown", alGesto);
    window.addEventListener("keydown", alGesto);

    return () => {
      window.removeEventListener("pointerdown", alGesto);
      window.removeEventListener("keydown", alGesto);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Pausar/reanudar según el mute.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muteado) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [muteado]);

  return null;
}
