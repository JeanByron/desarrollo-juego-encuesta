import { FormEvent, useState } from "react";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { supabase } from "@/lib/supabase";
import { useAdminStore } from "@/store/useAdminStore";

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD ?? "profesora";

export function Login() {
  const autenticar = useAdminStore((s) => s.autenticar);

  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [modo, setModo] = useState<"clave" | "supabase">("clave");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const entrarPorClave = (e: FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_PASS) {
      autenticar();
      setError(null);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const entrarPorSupabase = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password: emailPass
    });
    setCargando(false);
    if (err) {
      setError(err.message);
      return;
    }
    autenticar();
  };

  return (
    <Tarjeta className="space-y-6 max-w-md mx-auto">
      <h2 className="font-display text-3xl text-marca-rojo text-center">
        Panel de la profesora
      </h2>

      <div className="flex gap-2 justify-center text-sm">
        <button
          className={`underline ${modo === "clave" ? "font-bold" : "text-gray-500"}`}
          onClick={() => setModo("clave")}
        >
          Acceso rápido
        </button>
        <span>·</span>
        <button
          className={`underline ${modo === "supabase" ? "font-bold" : "text-gray-500"}`}
          onClick={() => setModo("supabase")}
        >
          Iniciar sesión
        </button>
      </div>

      {modo === "clave" ? (
        <form onSubmit={entrarPorClave} className="space-y-3">
          <p className="text-sm text-gray-600">
            Usa esta opción solo en clase. Para editar preguntas o registrar
            respuestas debes iniciar sesión real con Supabase (las RPC requieren
            usuario autenticado).
          </p>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Contraseña"
            className="w-full rounded-2xl border-4 border-marca-amarillo px-4 py-3 text-lg focus:outline-none focus:border-marca-rojo"
          />
          {error && <p className="text-marca-rojo font-bold">{error}</p>}
          <Boton type="submit" variante="primario" tamano="lg" className="w-full">
            Entrar
          </Boton>
        </form>
      ) : (
        <form onSubmit={entrarPorSupabase} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="profesora@colegio.edu"
            className="w-full rounded-2xl border-4 border-marca-amarillo px-4 py-3"
            required
          />
          <input
            type="password"
            value={emailPass}
            onChange={(e) => setEmailPass(e.target.value)}
            placeholder="Contraseña Supabase"
            className="w-full rounded-2xl border-4 border-marca-amarillo px-4 py-3"
            required
          />
          {error && <p className="text-marca-rojo font-bold">{error}</p>}
          <Boton
            type="submit"
            variante="primario"
            tamano="lg"
            className="w-full"
            disabled={cargando}
          >
            {cargando ? "Entrando..." : "Iniciar sesión"}
          </Boton>
        </form>
      )}
    </Tarjeta>
  );
}
