// Nubes blancas que cruzan el cielo lentamente (guiño al intro de Los Simpson).
// Decorativo: fijo, detrás del contenido y sin capturar clics.
const nubes = [
  { top: "10%", escala: 1, retraso: "0s", duracion: "70s" },
  { top: "26%", escala: 0.7, retraso: "-25s", duracion: "90s" },
  { top: "44%", escala: 1.2, retraso: "-50s", duracion: "60s" }
];

function Nube() {
  return (
    <div className="relative">
      <div className="w-28 h-12 rounded-full bg-white/90" />
      <div className="absolute -top-5 left-6 w-16 h-16 rounded-full bg-white/90" />
      <div className="absolute -top-3 left-16 w-12 h-12 rounded-full bg-white/90" />
    </div>
  );
}

export function Nubes() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {nubes.map((n, i) => (
        <div
          key={i}
          className="absolute left-0 animate-derivar"
          style={{
            top: n.top,
            transform: `scale(${n.escala})`,
            animationDelay: n.retraso,
            animationDuration: n.duracion
          }}
        >
          <Nube />
        </div>
      ))}
    </div>
  );
}
