import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminState {
  autenticada: boolean;
  autenticar: () => void;
  cerrar: () => void;
}

// Gate ligero para la profesora basado en una contraseña local.
// IMPORTANTE: esto NO sustituye RLS. Las RPC que modifican puntajes están
// protegidas por Supabase Auth (rol authenticated + tabla profesoras).
// Este gate solo evita que un alumno curioso entre por error a /admin.
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      autenticada: false,
      autenticar: () => set({ autenticada: true }),
      cerrar: () => set({ autenticada: false })
    }),
    { name: "admin-cultura-general" }
  )
);
