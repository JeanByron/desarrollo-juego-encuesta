import { FormEvent, useState } from "react";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Logo } from "@/components/shared/Logo";
import { LogoEscuela } from "@/components/shared/LogoEscuela";
import { contieneGroseria } from "@/lib/groserias";

interface Props {
  onListo: (nombre: string) => void;
}

export function PantallaNombre({ onListo }: Props) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length < 2) {
      setError("Escribe tu nombre (mínimo 2 letras).");
      return;
    }
    if (limpio.length > 50) {
      setError("Demasiado largo (máximo 50 caracteres).");
      return;
    }
    if (contieneGroseria(limpio)) {
      setError("Ese nombre no está permitido. Elige uno apropiado. 🙂");
      return;
    }
    onListo(limpio);
  };

  return (
    <Tarjeta className="space-y-6">
      <LogoEscuela className="h-20 w-20 mx-auto" />
      <Logo />
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="block font-display text-lg mb-2">Ingresa tu nombre</span>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juanita"
            maxLength={50}
            className="w-full rounded-2xl border-4 border-marca-amarillo px-4 py-4 text-2xl font-bold focus:outline-none focus:border-marca-rojo"
          />
        </label>
        {error && <p className="text-marca-rojo font-bold text-center">{error}</p>}
        <Boton type="submit" variante="peligro" tamano="xl" sonido="seleccion" className="w-full animate-latido">
          ¡Jugar!
        </Boton>
      </form>
    </Tarjeta>
  );
}
