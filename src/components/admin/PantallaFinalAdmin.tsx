import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import type { Jugador, Partida } from "@/types/database";

interface Props {
  partida: Partida;
  jugadores: Jugador[];
  cargando?: boolean;
  onNuevaPartida: () => void;
}

export function PantallaFinalAdmin({ partida, jugadores, cargando, onNuevaPartida }: Props) {
  return (
    <div className="space-y-6">
      <Tarjeta className="text-center space-y-4">
        <h2 className="font-display text-3xl text-marca-rojo">Partida finalizada</h2>
        <p>
          Empezó:{" "}
          <strong>{partida.fecha_inicio ? new Date(partida.fecha_inicio).toLocaleString() : "—"}</strong>
        </p>
        <p>
          Terminó:{" "}
          <strong>{partida.fecha_fin ? new Date(partida.fecha_fin).toLocaleString() : "—"}</strong>
        </p>
        <Boton
          variante="exito"
          tamano="xl"
          onClick={onNuevaPartida}
          disabled={cargando}
        >
          🎮 Nueva partida
        </Boton>
      </Tarjeta>
      <Tarjeta>
        <h3 className="font-display text-xl mb-3">Ranking final</h3>
        <TablaPuntajes jugadores={jugadores} />
      </Tarjeta>
    </div>
  );
}
