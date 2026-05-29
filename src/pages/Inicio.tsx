import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { Layout } from "@/components/shared/Layout";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Avatar } from "@/components/shared/Avatar";
import { LogoEscuela } from "@/components/shared/LogoEscuela";
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
    <Layout ancho="estrecho" centrado>
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Fila de personajes flotando. El escudo del colegio va en posición
            absoluta a la izquierda de Bart, para no desplazar los avatares. */}
        <div className="relative flex justify-center -space-x-2">
          <LogoEscuela className="absolute right-full top-1/2 -translate-y-1/2 mr-10 h-16 w-16 sm:h-20 sm:w-20" />
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
      </div>
    </Layout>
  );
}
