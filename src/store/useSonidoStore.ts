import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SonidoState {
  muteado: boolean;
  alternarMute: () => void;
}

// Preferencia de sonido del dispositivo (se recuerda entre recargas).
export const useSonidoStore = create<SonidoState>()(
  persist(
    (set) => ({
      muteado: false,
      alternarMute: () => set((s) => ({ muteado: !s.muteado }))
    }),
    { name: "sonido-cultura-general" }
  )
);
