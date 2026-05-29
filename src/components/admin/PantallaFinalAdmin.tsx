import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Podio } from "@/components/shared/Podio";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import type { Jugador, Partida } from "@/types/database";

interface Props {
  partida: Partida;
  jugadores: Jugador[];
  terminando?: boolean;
  onTerminar: () => void;
}

export function PantallaFinalAdmin({ partida, jugadores, terminando, onTerminar }: Props) {
  const podioRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);

  const descargarPantallazo = async () => {
    if (!podioRef.current) return;
    setDescargando(true);
    try {
      const canvas = await html2canvas(podioRef.current, {
        backgroundColor: "#FFFBEC", // crema, igual que las tarjetas
        scale: 2, // mayor resolución
        useCORS: true,
        logging: false
      });
      const enlace = document.createElement("a");
      const fecha = new Date().toISOString().slice(0, 10);
      enlace.download = `ganadores-${fecha}.png`;
      enlace.href = canvas.toDataURL("image/png");
      enlace.click();
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta que se captura en el pantallazo */}
      <Tarjeta ref={podioRef} className="text-center space-y-4">
        <h2 className="font-display text-3xl text-marca-rojo">🏆 ¡Ganadores!</h2>
        <Podio jugadores={jugadores} />
        <p className="text-sm text-gray-500">
          {partida.fecha_fin
            ? `Partida del ${new Date(partida.fecha_fin).toLocaleDateString()}`
            : "Partida finalizada"}
        </p>
      </Tarjeta>

      {/* Acciones: descargar pantallazo y, a su derecha, terminar partida */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Boton
          variante="primario"
          tamano="lg"
          onClick={descargarPantallazo}
          disabled={descargando || jugadores.length === 0}
        >
          {descargando ? "Generando..." : "📸 Descargar pantallazo"}
        </Boton>
        <Boton
          variante="peligro"
          tamano="lg"
          onClick={onTerminar}
          disabled={terminando}
        >
          {terminando ? "Terminando..." : "🏁 Terminar partida"}
        </Boton>
      </div>

      <Tarjeta>
        <h3 className="font-display text-xl mb-3">Ranking final</h3>
        <TablaPuntajes jugadores={jugadores} />
      </Tarjeta>
    </div>
  );
}
