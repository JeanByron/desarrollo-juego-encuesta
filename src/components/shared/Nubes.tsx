// Cielo de Los Simpson: degradado azul→pasto pintado en un layer fijo (cubre
// siempre el viewport, sin los problemas de `background-attachment: fixed` en
// móviles) + nubes blancas que cruzan lentamente.
// Decorativo: fijo, detrás del contenido y sin capturar clics.
const CIELO = "linear-gradient(180deg, #7fd0f5 0%, #aee3fb 55%, #cdeecb 82%, #9bd35a 100%)";

// Nubes repartidas por todo el cielo: `top` variado (de ~6% a ~72%) y el
// `retraso` negativo escalonado a lo largo de cada `duracion` para que en
// cualquier instante también queden distribuidas en horizontal.
const nubes = [
  { top: "6%", escala: 1.0, retraso: "-2s", duracion: "48s" },
  { top: "16%", escala: 0.6, retraso: "-6s", duracion: "38s" },
  { top: "12%", escala: 0.85, retraso: "-13s", duracion: "52s" },
  { top: "28%", escala: 1.2, retraso: "-20s", duracion: "56s" },
  { top: "24%", escala: 0.5, retraso: "-15s", duracion: "33s" },
  { top: "40%", escala: 0.9, retraso: "-28s", duracion: "50s" },
  { top: "52%", escala: 0.7, retraso: "-29s", duracion: "44s" },
  { top: "62%", escala: 1.05, retraso: "-44s", duracion: "58s" },
  { top: "70%", escala: 0.55, retraso: "-31s", duracion: "36s" },
  { top: "36%", escala: 0.65, retraso: "-38s", duracion: "40s" }
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
