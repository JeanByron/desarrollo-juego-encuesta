import { useSonidoStore } from "@/store/useSonidoStore";

// Botón flotante para silenciar/activar los sonidos. Disponible en todas las
// pantallas; la preferencia se recuerda entre recargas.
export function BotonMute() {
  const muteado = useSonidoStore((s) => s.muteado);
  const alternar = useSonidoStore((s) => s.alternarMute);

  return (
    // A la altura del título, alineado al borde derecho de la columna del menú
    // y un poco más a la derecha (translate-x), para que asome fuera del menú.
    <div className="fixed top-[32vh] inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto w-full max-w-md px-4 flex justify-end">
        <button
          type="button"
          onClick={alternar}
          aria-pressed={muteado}
          aria-label={muteado ? "Activar sonidos" : "Silenciar sonidos"}
          title={muteado ? "Activar sonidos" : "Silenciar sonidos"}
          className="pointer-events-auto translate-x-[110%] flex h-12 w-12 items-center justify-center
                     rounded-full bg-white/90 text-2xl shadow-candySm ring-2 ring-white
                     cursor-pointer transition-transform hover:scale-110
                     focus:outline-none focus:ring-4 focus:ring-marca-azul/60"
        >
          <span aria-hidden>{muteado ? "🔇" : "🔊"}</span>
        </button>
      </div>
    </div>
  );
}
