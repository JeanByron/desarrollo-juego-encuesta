import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BotonMute } from "./BotonMute";
import { PiePagina } from "./PiePagina";

interface Props {
  children: ReactNode;
  className?: string;
  ancho?: "estrecho" | "medio" | "ancho";
  /** Centra el contenido vertical y horizontalmente en la pantalla. */
  centrado?: boolean;
}

export function Layout({ children, className, ancho = "medio", centrado = false }: Props) {
  const max =
    ancho === "estrecho" ? "max-w-md" : ancho === "ancho" ? "max-w-6xl" : "max-w-3xl";

  return (
    <main className={cn("min-h-screen flex flex-col px-4 py-8 mx-auto w-full", max, className)}>
      {/* Botón de mute anclado al borde derecho del menú actual (sticky). La
          fila h-0 no ocupa espacio vertical. */}
      <div className="sticky top-3 z-50 flex h-0 w-full justify-end pointer-events-none">
        <BotonMute />
      </div>

      {/* Contenido. Si `centrado`, ocupa el espacio disponible y se centra. */}
      <div className={cn("w-full", centrado && "flex-1 flex items-center")}>{children}</div>

      {/* Pie con el crédito; mt-auto lo empuja al fondo cuando hay espacio. */}
      <PiePagina className="mt-auto" />
    </main>
  );
}
