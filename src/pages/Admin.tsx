import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Lobby } from "@/components/admin/Lobby";
import { PanelJuego } from "@/components/admin/PanelJuego";
import { PantallaFinalAdmin } from "@/components/admin/PantallaFinalAdmin";
import { GestorPreguntas } from "@/components/admin/GestorPreguntas";
import { usePartidaActiva } from "@/hooks/usePartidaActiva";
import { useJugadores } from "@/hooks/useJugadores";
import { useAvanzarPregunta, useReiniciarPartida } from "@/hooks/useAcciones";

export function AdminPage() {
  return (
    <Routes>
      <Route index element={<AdminPartida />} />
      <Route path="preguntas" element={<AdminPreguntas />} />
    </Routes>
  );
}

function NavAdmin({ titulo }: { titulo: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h1 className="font-display text-2xl">{titulo}</h1>
      <nav className="flex gap-2 text-sm">
        <Link to="/admin" className="underline">Partida</Link>
        <Link to="/admin/preguntas" className="underline">Preguntas</Link>
      </nav>
    </header>
  );
}

function AdminPartida() {
  const { data: partida, isLoading } = usePartidaActiva();
  const { data: jugadores = [] } = useJugadores(partida?.id);
  const avanzar = useAvanzarPregunta();
  const reiniciar = useReiniciarPartida();
  const [iniciando, setIniciando] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <NavAdmin titulo="Panel de la profesora" />
        <Tarjeta>Cargando partida...</Tarjeta>
      </Layout>
    );
  }

  if (!partida) {
    return (
      <Layout>
        <NavAdmin titulo="Panel de la profesora" />
        <Tarjeta className="text-center space-y-3">
          <p>No hay ninguna partida creada todavía.</p>
          <Boton
            variante="exito"
            tamano="lg"
            onClick={() => reiniciar.mutate()}
            disabled={reiniciar.isPending}
          >
            Crear partida
          </Boton>
        </Tarjeta>
      </Layout>
    );
  }

  const onIniciar = () => {
    setIniciando(true);
    avanzar.mutate(partida.id, { onSettled: () => setIniciando(false) });
  };

  const onReiniciar = () => {
    if (!confirm("¿Crear una partida nueva? Los jugadores actuales tendrán que volver a entrar."))
      return;
    reiniciar.mutate();
  };

  return (
    <Layout ancho="ancho">
      <NavAdmin titulo="Panel de la profesora" />
      {partida.estado === "lobby" && (
        <Lobby
          partida={partida}
          jugadores={jugadores}
          cargando={iniciando}
          onIniciar={onIniciar}
          onReiniciar={onReiniciar}
        />
      )}
      {partida.estado === "en_curso" && (
        <PanelJuego partida={partida} jugadores={jugadores} />
      )}
      {partida.estado === "finalizada" && (
        <PantallaFinalAdmin
          partida={partida}
          jugadores={jugadores}
          cargando={reiniciar.isPending}
          onNuevaPartida={() => reiniciar.mutate()}
        />
      )}
    </Layout>
  );
}

function AdminPreguntas() {
  return (
    <Layout ancho="ancho">
      <NavAdmin titulo="Gestión del banco de preguntas" />
      <GestorPreguntas />
    </Layout>
  );
}
