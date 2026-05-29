import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Podio } from "@/components/shared/Podio";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import type { Jugador } from "@/types/database";
import { ordinal } from "@/lib/utils";

interface Props {
  yo: Jugador;
  jugadores: Jugador[];
  onSalir: () => void;
}

export function PantallaFinal({ yo, jugadores, onSalir }: Props) {
  const miPosicion = jugadores.findIndex((j) => j.id === yo.id) + 1;

  return (
    <div className="space-y-6">
      <Tarjeta className="text-center space-y-4">
        <h2 className="font-display text-3xl text-marca-rojo">¡Fin del juego! 🎉</h2>
        <p className="font-display text-xl">Estos son los ganadores:</p>

        <Podio jugadores={jugadores} destacarId={yo.id} />

        <p className="font-display text-lg">
          Tu posición: <strong>{ordinal(miPosicion)}</strong> con{" "}
          <strong>{yo.puntos}</strong> puntos
        </p>
      </Tarjeta>

      <Tarjeta>
        <h3 className="font-display text-xl text-center mb-3">Tabla final</h3>
        <TablaPuntajes jugadores={jugadores} destacarId={yo.id} />
      </Tarjeta>

      <Boton variante="neutro" tamano="lg" className="w-full" onClick={onSalir}>
        Salir
      </Boton>
    </div>
  );
}
