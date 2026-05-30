// =============================================================================
// Confeti celebratorio — lluvia de papelitos de colores (CSS puro).
//
// Se monta como overlay fijo, sin bloquear clics (pointer-events: none).
// Cada papelito tiene posición horizontal, delay y velocidad aleatorios,
// generados una sola vez al montar con useMemo.
// =============================================================================

import { useMemo } from "react";

const COLORES = [
  "#FFD21E", // amarillo Simpson
  "#E8362C", // rojo Bart
  "#6FB52E", // verde pasto
  "#2F86E0", // azul
  "#A86BD6", // morado
  "#FF8FB3", // rosa dona
  "#FF7A1A", // naranja Simpson
  "#FFFFFF", // blanco
];

const CANTIDAD = 40;

interface Papelito {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  size: number;
  rotacion: number;
}

export function ConfettiCelebration() {
  const papelitos: Papelito[] = useMemo(
    () =>
      Array.from({ length: CANTIDAD }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 2}s`,
        color: COLORES[Math.floor(Math.random() * COLORES.length)],
        size: 6 + Math.random() * 8,
        rotacion: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="confetti-contenedor" aria-hidden="true">
      {papelitos.map((p) => (
        <span
          key={p.id}
          className="confetti-papelito"
          style={
            {
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size * 0.6}px`,
              "--rotacion-ini": `${p.rotacion}deg`,
              "--rotacion-fin": `${p.rotacion + 720}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
