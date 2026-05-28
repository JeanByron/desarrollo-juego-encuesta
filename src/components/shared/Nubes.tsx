import { useMemo } from "react";

// Cielo de Los Simpson: degradado azul→pasto pintado en un layer fijo (cubre
// siempre el viewport, sin los problemas de `background-attachment: fixed` en
// móviles) + nubes blancas que cruzan lentamente.
// Decorativo: fijo, detrás del contenido y sin capturar clics.
const CIELO = "linear-gradient(180deg, #7fd0f5 0%, #aee3fb 55%, #cdeecb 82%, #9bd35a 100%)";

const CANTIDAD = 11;

interface NubeCfg {
  top: number; // %
  escala: number;
  duracion: number; // s
  retraso: number; // s (negativo: adelanta la fase para repartirlas en horizontal)
}

const aleatorio = (min: number, max: number) => min + Math.random() * (max - min);

// Genera nubes repartidas por todo el cielo: el `top` se reparte en bandas
// (una por nube) con jitter para que no se amontonen, y el desfase horizontal
// es aleatorio dentro de la duración de cada nube. Cambia en cada refresco.
function generarNubes(): NubeCfg[] {
  const arribaMin = 4;
  const arribaMax = 74;
  const banda = (arribaMax - arribaMin) / CANTIDAD;

  return Array.from({ length: CANTIDAD }, (_, i) => {
    const duracion = aleatorio(34, 60);
    return {
      top: arribaMin + banda * i + aleatorio(0, banda * 0.8),
      escala: aleatorio(0.45, 1.25),
      duracion,
      // Fase aleatoria: la nube empieza en un punto cualquiera de su recorrido.
      retraso: -aleatorio(0, duracion)
    };
  });
}

// Nube de varios bultos (no un óvalo): un cuerpo alargado + tres montículos.
function Nube() {
  return (
    <div className="relative w-32 h-12">
      <div className="absolute bottom-0 left-0 w-32 h-9 rounded-full bg-white/95" />
      <div className="absolute bottom-2 left-3 w-14 h-14 rounded-full bg-white/95" />
      <div className="absolute bottom-3 left-12 w-16 h-16 rounded-full bg-white/95" />
      <div className="absolute bottom-2 left-[5.5rem] w-12 h-12 rounded-full bg-white/95" />
    </div>
  );
}

export function Nubes() {
  // Se generan una sola vez por montaje (es decir, por carga/refresco de página).
  const nubes = useMemo(generarNubes, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: CIELO }}
    >
      {nubes.map((n, i) => (
        // Capa externa: solo el desplazamiento horizontal (animación).
        <div
          key={i}
          className="absolute left-0 animate-derivar"
          style={{
            top: `${n.top}%`,
            animationDelay: `${n.retraso}s`,
            animationDuration: `${n.duracion}s`
          }}
        >
          {/* Capa interna: la escala, para que la animación no la sobrescriba. */}
          <div style={{ transform: `scale(${n.escala})` }}>
            <Nube />
          </div>
        </div>
      ))}
    </div>
  );
}
