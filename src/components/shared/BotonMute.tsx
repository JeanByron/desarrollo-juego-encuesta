import { useSonidoStore } from "@/store/useSonidoStore";

// Botón para silenciar/activar los sonidos. Su posición la define el Layout
// (alineado al borde del menú actual); aquí solo va el estilo del botón.
// La preferencia se recuerda entre recargas.
export function BotonMute() {
  const muteado = useSonidoStore((s) => s.muteado);
  const alternar = useSonidoStore((s) => s.alternarMute);

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={muteado}
      aria-label={muteado ? "Activar sonidos" : "Silenciar sonidos"}
      title={muteado ? "Activar sonidos" : "Silenciar sonidos"}
      className="pointer-events-auto flex h-12 w-12 items-center justify-center
                 rounded-full bg-white/90 text-2xl shadow-candySm ring-2 ring-white
                 cursor-pointer transition-transform hover:scale-110
                 focus:outline-none focus:ring-4 focus:ring-marca-azul/60"
    >
      <span aria-hidden>{muteado ? "🔇" : "🔊"}</span>
    </button>
  );
}
