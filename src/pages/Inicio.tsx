import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { Layout } from "@/components/shared/Layout";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";

export function Inicio() {
  return (
    <Layout ancho="estrecho" className="flex items-center min-h-screen">
      <Tarjeta className="w-full space-y-6">
        <Logo />
        <div className="space-y-3">
          <Link to="/jugar">
            <Boton variante="peligro" tamano="xl" className="w-full animate-latido">
              🎮 Soy estudiante
            </Boton>
          </Link>
          <Link to="/admin">
            <Boton variante="primario" tamano="lg" className="w-full">
              👩‍🏫 Soy la profesora
            </Boton>
          </Link>
        </div>
        <p className="text-xs text-center text-gray-500">
          Versión web · funciona en celular, tablet y computador
        </p>
      </Tarjeta>
    </Layout>
  );
}
