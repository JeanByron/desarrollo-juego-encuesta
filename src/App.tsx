import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Inicio } from "@/pages/Inicio";
import { JugadorPage } from "@/pages/Jugador";
import { Nubes } from "@/components/shared/Nubes";
import { MusicaFondo } from "@/components/shared/MusicaFondo";

// La pantalla de la profesora carga librerías pesadas (Excel, captura de
// imagen, CSV) que los estudiantes nunca usan. La cargamos "perezosa" (en su
// propio archivo aparte) para que el dispositivo del alumno NO tenga que
// descargarlas: arranca más rápido y gasta menos ancho de banda.
const AdminPage = lazy(() =>
  import("@/pages/Admin").then((m) => ({ default: m.AdminPage }))
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Cielo con nubes a la deriva, detrás de todas las pantallas */}
        <Nubes />
        {/* Música de fondo en bucle (a bajo volumen) */}
        <MusicaFondo />
        {/* Suspense cubre el instante en que se descarga el código de /admin. */}
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/jugar" element={<JugadorPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
