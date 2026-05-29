import { cn } from "@/lib/utils";

// Escudo del colegio. Se muestra solo en el menú principal (Inicio), en línea
// a la izquierda de la fila de personajes.
export function LogoEscuela({ className }: { className?: string }) {
  return (
    <img
      src="/logo_escuela.png"
      alt="Colegio Atanasio Girardot"
      className={cn("object-contain drop-shadow-md select-none", className)}
    />
  );
}
