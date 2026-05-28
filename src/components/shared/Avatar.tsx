import { cn } from "@/lib/utils";
import { buscarPersonaje } from "@/data/personajes";

interface Props {
  avatarId: string;
  tamano?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const dimensiones: Record<NonNullable<Props["tamano"]>, string> = {
  sm: "w-10 h-10 text-2xl",
  md: "w-16 h-16 text-3xl",
  lg: "w-24 h-24 text-5xl",
  xl: "w-40 h-40 text-7xl md:w-48 md:h-48 md:text-8xl"
};

export function Avatar({ avatarId, tamano = "md", className }: Props) {
  const personaje = buscarPersonaje(avatarId);
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shadow-lg ring-4 ring-white",
        personaje?.color ?? "bg-gray-300",
        dimensiones[tamano],
        className
      )}
      title={personaje?.nombre}
    >
      <span aria-hidden>{personaje?.emoji ?? "❓"}</span>
    </div>
  );
}
