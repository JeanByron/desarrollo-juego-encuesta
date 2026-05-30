import { useEffect, useState } from "react";

// =============================================================================
// Overlay de pantalla completa que muestra una animación grande de ✔ CORRECTO
// o ✖ INCORRECTO cada vez que la profesora marca una respuesta.
//
// Se muestra tanto en la pantalla de la profesora como en la del jugador,
// garantizando feedback visual incluso cuando el sonido está muteado.
//
// Se auto-destruye después de la animación (~2 s).
// =============================================================================

export type ResultadoVisual = "correcto" | "incorrecto" | null;

interface Props {
  resultado: ResultadoVisual;
  /** Se llama cuando la animación terminó y se puede limpiar el estado. */
  onTerminado: () => void;
}

export function ResultadoOverlay({ resultado, onTerminado }: Props) {
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (!resultado) return;

    // Montamos con un micro-delay para activar la transición de entrada.
    const enterTimer = setTimeout(() => setVisible(true), 30);

    // Iniciamos la salida a los 1.5 s.
    const exitTimer = setTimeout(() => setSaliendo(true), 1500);

    // Desmontamos a los 2 s.
    const doneTimer = setTimeout(() => {
      setVisible(false);
      setSaliendo(false);
      onTerminado();
    }, 2100);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [resultado, onTerminado]);

  if (!resultado) return null;

  const esCorrect = resultado === "correcto";

  return (
    <div
      className={`resultado-overlay ${esCorrect ? "resultado-overlay--correcto" : "resultado-overlay--incorrecto"} ${visible && !saliendo ? "resultado-overlay--visible" : ""} ${saliendo ? "resultado-overlay--saliendo" : ""}`}
    >
      {/* Partículas decorativas */}
      <div className="resultado-particulas">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="resultado-particula"
            style={
              {
                "--angulo": `${i * 30}deg`,
                "--delay": `${i * 0.04}s`,
                "--distancia": `${80 + Math.random() * 60}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Ícono principal */}
      <div className="resultado-icono">
        {esCorrect ? "✔" : "✖"}
      </div>

      {/* Texto */}
      <p className="resultado-texto">
        {esCorrect ? "¡CORRECTO!" : "INCORRECTO"}
      </p>
    </div>
  );
}
