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
  md: "w-14 h-14 text-2xl sm:w-16 sm:h-16 sm:text-3xl",
  lg: "w-20 h-20 text-4xl sm:w-24 sm:h-24 sm:text-5xl",
  xl: "w-36 h-36 text-6xl sm:w-44 sm:h-44 sm:text-7xl md:w-48 md:h-48 md:text-8xl"
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
