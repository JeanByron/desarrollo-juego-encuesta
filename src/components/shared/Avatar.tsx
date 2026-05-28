import { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { buscarPersonaje } from "@/data/personajes";

interface Props {
  avatarId: string;
  tamano?: "sm" | "md" | "lg" | "xl";
  /** Anima una flotación suave continua (útil en pantallas de espera). */
  flotando?: boolean;
  className?: string;
  style?: CSSProperties;
}

const dimensiones: Record<NonNullable<Props["tamano"]>, string> = {
  sm: "w-10 h-10 text-2xl",
  md: "w-16 h-16 text-3xl",
  lg: "w-24 h-24 text-5xl",
  xl: "w-40 h-40 text-7xl md:w-48 md:h-48 md:text-8xl"
};

export function Avatar({ avatarId, tamano = "md", flotando, className, style }: Props) {
  const personaje = buscarPersonaje(avatarId);
  return (
    <div
      style={style}
      className={cn(
        "rounded-full flex items-center justify-center select-none",
        "shadow-candySm ring-4 ring-white transition-transform duration-200",
        "hover:scale-110 hover:animate-meneo",
        personaje?.color ?? "bg-gray-300",
        dimensiones[tamano],
        flotando && "animate-flotar",
        className
      )}
      title={personaje?.nombre}
    >
      <span aria-hidden>{personaje?.emoji ?? "❓"}</span>
    </div>
  );
}
