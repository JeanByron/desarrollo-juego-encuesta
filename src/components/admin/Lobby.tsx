import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Avatar } from "@/components/shared/Avatar";
import { useExpulsarJugador } from "@/hooks/useAcciones";
import type { Jugador, Partida } from "@/types/database";

interface Props {
  partida: Partida;
  jugadores: Jugador[];
  cargando?: boolean;
  onIniciar: () => void;
  onReiniciar: () => void;
}

export function Lobby({ partida, jugadores, cargando, onIniciar, onReiniciar }: Props) {
  const expulsar = useExpulsarJugador();
  return (
    <div className="space-y-6">
      <Tarjeta className="text-center space-y-4">
        <h2 className="font-display text-3xl">Lobby</h2>
        <p className="text-gray-600">
          Comparte el enlace <code className="bg-yellow-100 px-2 py-1 rounded">/jugar</code>{" "}
          con tus estudiantes. Tan pronto se conecten los verás aquí.
        </p>
        <p className="font-display text-xl">
          Estudiantes conectados:{" "}
          <span className="text-marca-rojo">{jugadores.length}</span>
        </p>
        <div className="flex gap-2 justify-center">
          <Boton
            variante="exito"
            tamano="xl"
            onClick={onIniciar}
            disabled={cargando || jugadores.length === 0}
            className="animate-latido"
          >
            🚀 Iniciar juego
          </Boton>
          <Boton variante="neutro" onClick={onReiniciar} disabled={cargando}>
            Reiniciar lobby
          </Boton>
        </div>
        <p className="text-xs text-gray-400">
          Partida #{partida.id.slice(0, 8)} · {partida.estado}
        </p>
      </Tarjeta>

      <Tarjeta>
        <h3 className="font-display text-xl mb-3">Jugadores</h3>
        {jugadores.length === 0 ? (
          <p className="text-center text-gray-500 italic py-6">
            Aún no se ha conectado nadie. Espera a tus estudiantes...
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {jugadores.map((j) => (
              <li
                key={j.id}
                className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2 shadow"
              >
                <Avatar avatarId={j.avatar} tamano="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{j.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">{j.estado}</p>
                </div>
                <Boton
                  variante="peligroSuave"
                  tamano="md"
                  title={`Expulsar a ${j.nombre}`}
                  disabled={expulsar.isPending}
                  onClick={() => {
                    if (confirm(`¿Expulsar a ${j.nombre} de la partida?`)) {
                      expulsar.mutate(j.id);
                    }
                  }}
                >
                  Expulsar
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
