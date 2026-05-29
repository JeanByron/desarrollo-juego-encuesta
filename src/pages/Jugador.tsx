import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/shared/Layout";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { PantallaNombre } from "@/components/jugador/PantallaNombre";
import { SeleccionPersonaje } from "@/components/jugador/SeleccionPersonaje";
import { PantallaEspera } from "@/components/jugador/PantallaEspera";
import { PantallaJuego } from "@/components/jugador/PantallaJuego";
import { PantallaFinal } from "@/components/jugador/PantallaFinal";
import { usePartidaActiva } from "@/hooks/usePartidaActiva";
import { useJugadores } from "@/hooks/useJugadores";
import { usePlayerStore } from "@/store/usePlayerStore";
import { supabase } from "@/lib/supabase";

export function JugadorPage() {
  const { data: partida, isLoading } = usePartidaActiva();
  const { data: jugadores = [] } = useJugadores(partida?.id);
  const { jugadorId, nombre, avatar, partidaId, setIdentidad, limpiar } = usePlayerStore();
  const [pasoLocal, setPasoLocal] = useState<"nombre" | "personaje">("nombre");
  const [nombreLocal, setNombreLocal] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si la partida cambió desde que el jugador se registró, lo "expulsamos"
  // para que vuelva a unirse a la nueva.
  const yo = useMemo(() => {
    if (!jugadorId || !partida) return null;
    if (partidaId && partidaId !== partida.id) return null;
    return jugadores.find((j) => j.id === jugadorId) ?? null;
  }, [jugadorId, partidaId, partida, jugadores]);

  // Si la profesora terminó la partida y vació la BD (ya no hay ninguna partida)
  // y este dispositivo tenía identidad de jugador, lo devolvemos a /jugar.
  useEffect(() => {
    if (!isLoading && !partida && jugadorId) {
      limpiar();
      window.location.href = "https://desarrollo-juego-encuesta.vercel.app/jugar";
    }
  }, [isLoading, partida, jugadorId, limpiar]);

  // Al cerrar la pestaña/navegador, eliminamos al jugador de la BD para que no
  // quede "fantasma" en la lista. Usamos fetch con keepalive porque las
  // peticiones normales se cancelan al descargarse la página. El evento
  // `pagehide` es el más fiable para cierre/navegación (también en móvil) y NO
  // se dispara al cambiar de pestaña, así que no expulsa por error.
  useEffect(() => {
    if (!jugadorId) return;
    const onCerrar = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (url && key) {
        fetch(`${url}/rest/v1/jugadores?id=eq.${jugadorId}`, {
          method: "DELETE",
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          keepalive: true
        }).catch(() => {});
      }
      // Limpiamos la identidad guardada para que al reabrir se registre de nuevo.
      try {
        localStorage.removeItem("jugador-cultura-general");
      } catch {
        // ignoramos
      }
    };
    window.addEventListener("pagehide", onCerrar);
    return () => window.removeEventListener("pagehide", onCerrar);
  }, [jugadorId]);

  if (isLoading) {
    return (
      <Layout ancho="estrecho" centrado>
        <Tarjeta className="text-center">Cargando partida...</Tarjeta>
      </Layout>
    );
  }

  if (!partida) {
    return (
      <Layout ancho="estrecho" centrado>
        <Tarjeta className="text-center space-y-2">
          <h2 className="font-display text-2xl">Aún no hay partida</h2>
          <p className="text-gray-600">
            Espera a que la profesora abra el juego e ingresa de nuevo.
          </p>
        </Tarjeta>
      </Layout>
    );
  }

  // Si la partida fue finalizada y este estudiante estaba dentro, mostrar el final.
  if (partida.estado === "finalizada") {
    if (yo) {
      return (
        <Layout>
          <PantallaFinal
            yo={yo}
            jugadores={jugadores}
            onSalir={() => {
              limpiar();
              setPasoLocal("nombre");
            }}
          />
        </Layout>
      );
    }
    return (
      <Layout ancho="estrecho" centrado>
        <Tarjeta className="text-center space-y-2">
          <h2 className="font-display text-2xl">La partida ya terminó</h2>
          <p>Espera a que la profesora cree una nueva para volver a jugar.</p>
        </Tarjeta>
      </Layout>
    );
  }

  // Flujo de registro
  if (!yo) {
    if (pasoLocal === "nombre") {
      return (
        <Layout ancho="estrecho" centrado>
          <PantallaNombre
            onListo={(n) => {
              setNombreLocal(n);
              setPasoLocal("personaje");
            }}
          />
        </Layout>
      );
    }

    return (
      <Layout ancho="estrecho" centrado>
        <SeleccionPersonaje
          nombre={nombreLocal || nombre}
          cargando={registrando}
          onVolver={() => setPasoLocal("nombre")}
          onElegir={async (avatarId) => {
            setRegistrando(true);
            setError(null);
            const { data, error } = await supabase
              .from("jugadores")
              .insert({
                partida_id: partida.id,
                nombre: nombreLocal,
                avatar: avatarId
              })
              .select()
              .single();
            setRegistrando(false);
            if (error || !data) {
              const esNombreDuplicado =
                error?.code === "23505" &&
                error.message.includes("nombre");
              setError(
                esNombreDuplicado
                  ? "Ese nombre ya está en uso, elige otro."
                  : (error?.message ?? "No se pudo registrar")
              );
              if (esNombreDuplicado) setPasoLocal("nombre");
              return;
            }
            setIdentidad({
              jugadorId: data.id,
              nombre: data.nombre,
              avatar: data.avatar,
              partidaId: partida.id
            });
          }}
        />
        {error && (
          <p className="text-center mt-4 text-marca-rojo font-bold">{error}</p>
        )}
      </Layout>
    );
  }

  // Ya estoy registrado
  if (partida.estado === "lobby") {
    return (
      <Layout ancho="estrecho" centrado>
        <PantallaEspera yo={yo} jugadores={jugadores} />
      </Layout>
    );
  }

  return (
    <Layout>
      <PantallaJuego partida={partida} yo={yo} jugadores={jugadores} />
    </Layout>
  );
}
