import { useState } from "react";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Avatar } from "@/components/shared/Avatar";
import { PERSONAJES } from "@/data/personajes";
import type { Jugador } from "@/types/database";
import { cn } from "@/lib/utils";
import { useSonidos } from "@/hooks/useSonidos";

interface Props {
  nombre: string;
  jugadores: Jugador[];                  // para deshabilitar avatares ya tomados
  cargando?: boolean;
  onElegir: (avatarId: string) => void;
  onVolver: () => void;
}

export function SeleccionPersonaje({ nombre, jugadores, cargando, onElegir, onVolver }: Props) {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const tomados = new Set(jugadores.map((j) => j.avatar));
  const { reproducir } = useSonidos();

  return (
    <Tarjeta className="space-y-6">
      <header className="text-center">
        <p className="font-display text-lg text-gray-600">Bienvenida, bienvenido</p>
        <h2 className="font-display text-3xl text-marca-rojo">{nombre}</h2>
        <p className="font-display text-xl mt-2">Elige tu personaje</p>
      </header>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {PERSONAJES.map((p) => {
          const ocupado = tomados.has(p.id);
          const elegido = seleccion === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={ocupado}
              onClick={() => {
                setSeleccion(p.id);
                reproducir("seleccion");
              }}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer",
                "border-4",
                elegido
                  ? "border-marca-rojo scale-110 bg-simpson-amarillo/30 shadow-candySm"
                  : "border-transparent",
                ocupado ? "opacity-30 cursor-not-allowed" : "hover:bg-simpson-amarillo/20 hover:scale-105"
              )}
            >
              <Avatar avatarId={p.id} tamano="lg" />
              <span className="font-display font-bold text-sm">{p.nombre}</span>
              {ocupado && <span className="text-xs text-gray-500">ocupado</span>}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Boton variante="neutro" onClick={onVolver} className="flex-1">
          Volver
        </Boton>
        <Boton
          variante="exito"
          tamano="lg"
          sonido="seleccion"
          className="flex-[2]"
          disabled={!seleccion || cargando}
          onClick={() => seleccion && onElegir(seleccion)}
        >
          {cargando ? "Entrando..." : "¡Listo!"}
        </Boton>
      </div>
    </Tarjeta>
  );
}
