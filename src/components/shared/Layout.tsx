import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BotonMute } from "./BotonMute";

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

  const base = centrado
    ? // `m-auto` centra el bloque cuando hay espacio libre y, si el contenido es
      // más alto que la pantalla (móviles pequeños), se comporta como margen 0.
      "min-h-screen flex flex-col px-4 py-8 mx-auto w-full"
    : "min-h-full px-4 py-8 mx-auto w-full";

  return (
    <main className={cn(base, max, className)}>
      {/* Botón de mute anclado al borde derecho del menú actual (sigue su ancho)
          y sticky para mantenerse visible al hacer scroll. La fila h-0 no ocupa
          espacio vertical. */}
      <div className="sticky top-3 z-50 flex h-0 w-full justify-end pointer-events-none">
        <BotonMute />
      </div>
      {centrado ? <div className="m-auto w-full">{children}</div> : children}
    </main>
  );
}
