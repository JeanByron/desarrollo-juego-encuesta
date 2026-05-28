// Cielo de Los Simpson: degradado azul→pasto pintado en un layer fijo (cubre
// siempre el viewport, sin los problemas de `background-attachment: fixed` en
// móviles) + nubes blancas que cruzan lentamente.
// Decorativo: fijo, detrás del contenido y sin capturar clics.
const CIELO = "linear-gradient(180deg, #7fd0f5 0%, #aee3fb 55%, #cdeecb 82%, #9bd35a 100%)";

const nubes = [
  { top: "8%", escala: 1.0, retraso: "0s", duracion: "45s" },
  { top: "20%", escala: 0.65, retraso: "-12s", duracion: "38s" },
  { top: "34%", escala: 1.25, retraso: "-28s", duracion: "55s" },
  { top: "13%", escala: 0.85, retraso: "-22s", duracion: "50s" },
  { top: "46%", escala: 0.5, retraso: "-8s", duracion: "34s" }
];

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
          style={{ top: n.top, animationDelay: n.retraso, animationDuration: n.duracion }}
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
