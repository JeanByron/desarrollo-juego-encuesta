// Wordmark estilo Los Simpson: letras rojas e infladas con contorno blanco,
// una dona flotando y el subtítulo en tono escolar. El contorno se logra con
// múltiples text-shadow (efecto "sticker" de caricatura).
const contorno = {
  textShadow:
    "-3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 3px 3px 0 #fff, 0 7px 0 rgba(0,0,0,0.18)"
} as const;

export function Logo() {
  return (
    <div className="text-center">
      <span
        className="inline-block text-2xl md:text-4xl font-display font-extrabold text-simpson-tinta -rotate-2 animate-flotar"
        aria-hidden
      >
        🍩
      </span>
      <h1 className="font-display font-extrabold leading-none">
        <span
          className="block text-5xl md:text-7xl text-marca-rojo -rotate-1"
          style={contorno}
        >
          ¡A jugar!
        </span>
        <span className="mt-3 inline-block rounded-full bg-marca-azul px-4 py-1 text-lg md:text-2xl text-white shadow-candySm rotate-1">
          Cultura general en clase 🎓
        </span>
      </h1>
    </div>
  );
}
