import { cn } from "@/lib/utils";

// Escudo del colegio (archivo en /public/logo_escuela.png).
// Se reutiliza en dos sitios:
//   1. El menú principal (Inicio), junto a la fila de personajes.
//   2. La esquina superior izquierda de las pantallas del estudiante,
//      activándolo con la prop `logoEscuela` del componente Layout.
// El tamaño no está fijo aquí: lo decide quien lo usa pasando clases por
// `className` (p. ej. "w-10 h-10").
export function LogoEscuela({ className }: { className?: string }) {
  return (
    <img
      src="/logo_escuela.png"
      alt="Colegio Atanasio Girardot"
      className={cn("object-contain drop-shadow-md select-none", className)}
    />
  );
}
