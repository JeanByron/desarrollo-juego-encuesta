import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { Layout } from "@/components/shared/Layout";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Avatar } from "@/components/shared/Avatar";
import { useSonidos } from "@/hooks/useSonidos";

// Personajes que "asoman" en la portada, cada uno flotando a su ritmo.
const PORTADA = ["bart", "lisa", "homero", "marge", "maggie"];

export function Inicio() {
  const { reproducir } = useSonidos();

  // Pequeña fanfarria al abrir la portada (si el navegador la permite).
  useEffect(() => {
    reproducir("inicio");
  }, [reproducir]);

  return (
      <Layout ancho="estrecho" className="flex flex-col items-center justify-center min-h-screen gap-6">
        {/* Fila de personajes flotando sobre la tarjeta */}
        <div className="flex justify-center -space-x-2">
          {PORTADA.map((id, i) => (
            <Avatar
              key={id}
              avatarId={id}
              tamano="md"
              flotando
              // Desfasar la flotación para que no se muevan todos igual
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>

        <Tarjeta className="w-full space-y-6">
          <Logo />
          <div className="space-y-3">
            <Link to="/jugar">
              <Boton variante="peligro" tamano="xl" sonido="seleccion" className="w-full animate-latido">
                🎮 Soy estudiante
              </Boton>
            </Link>
            <Link to="/admin">
              <Boton variante="primario" tamano="lg" className="w-full">
                👩‍🏫 Soy la profesora
              </Boton>
            </Link>
          </div>
        </Tarjeta>
      </Layout>
  );
}
