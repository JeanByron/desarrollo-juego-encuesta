import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Inicio } from "@/pages/Inicio";
import { JugadorPage } from "@/pages/Jugador";
import { AdminPage } from "@/pages/Admin";
import { Nubes } from "@/components/shared/Nubes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Cielo con nubes a la deriva, detrás de todas las pantallas */}
        <Nubes />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/jugar" element={<JugadorPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
