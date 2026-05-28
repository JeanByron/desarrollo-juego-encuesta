import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

  if (centrado) {
    // `m-auto` centra el bloque cuando hay espacio libre y, si el contenido es
    // más alto que la pantalla (móviles pequeños), se comporta como margen 0 y
    // queda desplazable sin recortarse.
    return (
      <main className={cn("min-h-screen flex flex-col px-4 py-8 mx-auto w-full", max, className)}>
        <div className="m-auto w-full">{children}</div>
      </main>
    );
  }

  return (
    <main className={cn("min-h-full px-4 py-8 mx-auto w-full", max, className)}>
      {children}
    </main>
  );
}
