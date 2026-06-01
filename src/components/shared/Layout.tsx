import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BotonMute } from "./BotonMute";
import { LogoEscuela } from "./LogoEscuela";
import { PiePagina } from "./PiePagina";

interface Props {
  children: ReactNode;
  className?: string;
  ancho?: "estrecho" | "medio" | "ancho";
  /** Centra el contenido vertical y horizontalmente en la pantalla. */
  centrado?: boolean;
  /** Muestra el logo del colegio en la esquina superior izquierda. */
  logoEscuela?: boolean;
}

export function Layout({ children, className, ancho = "medio", centrado = false, logoEscuela = false }: Props) {
  const max =
    ancho === "estrecho" ? "max-w-md" : ancho === "ancho" ? "max-w-6xl" : "max-w-3xl";

  return (
    <main className={cn("min-h-screen flex flex-col px-4 py-8 mx-auto w-full", max, className)}>
      {/* Overlay sticky: logo escuela (izquierda) + botón mute (derecha). La
          fila h-0 no ocupa espacio vertical. */}
      <div className="sticky top-3 z-50 flex h-0 w-full items-start justify-between pointer-events-none">
        {logoEscuela ? (
          <LogoEscuela className="w-10 h-10 pointer-events-auto" />
        ) : (
          <span />
        )}
        <BotonMute />
      </div>

      {/* Contenido. Si `centrado`, ocupa el espacio disponible y se centra. */}
      <div className={cn("w-full", centrado && "flex-1 flex items-center")}>{children}</div>

      {/* Pie con el crédito; mt-auto lo empuja al fondo cuando hay espacio. */}
      <PiePagina className="mt-auto" />
    </main>
  );
}
