import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  jugadorId: string | null;
  nombre: string;
  avatar: string;
  partidaId: string | null;
  setIdentidad: (data: { jugadorId: string; nombre: string; avatar: string; partidaId: string }) => void;
  limpiar: () => void;
}

// Guardamos la identidad en localStorage para que si el estudiante recarga la
// página o pierde un instante la conexión, conserve su jugadorId y siga sumando
// puntos en la misma partida.
export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      jugadorId: null,
      nombre: "",
      avatar: "",
      partidaId: null,
      setIdentidad: ({ jugadorId, nombre, avatar, partidaId }) =>
        set({ jugadorId, nombre, avatar, partidaId }),
      limpiar: () => set({ jugadorId: null, nombre: "", avatar: "", partidaId: null })
    }),
    { name: "jugador-cultura-general" }
  )
);
