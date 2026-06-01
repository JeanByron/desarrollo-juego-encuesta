import { CSSProperties, useState } from "react";
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
  lg: "w-24 h-24 text-4xl sm:w-28 sm:h-28 sm:text-5xl",
  xl: "w-36 h-36 text-6xl sm:w-44 sm:h-44 sm:text-7xl md:w-48 md:h-48 md:text-8xl"
};

export function Avatar({ avatarId, tamano = "md", flotando, className, style }: Props) {
  const personaje = buscarPersonaje(avatarId);
  // Si la imagen no carga (404, red caída, etc.) caemos al emoji.
  const [imagenFallo, setImagenFallo] = useState(false);
  const mostrarImagen = !!personaje?.imagen && !imagenFallo;

  return (
    <div
      style={style}
      className={cn(
        "rounded-full overflow-hidden flex items-center justify-center select-none",
        "shadow-candySm ring-4 ring-white transition-transform duration-200",
        "hover:scale-110 hover:animate-meneo",
        // Fondo turquesa detrás del personaje (los amarillos como Homero/Bart/Lisa destacan).
        "bg-teal-400",
        dimensiones[tamano],
        flotando && "animate-flotar",
        className
      )}
      title={personaje?.nombre}
    >
      {mostrarImagen ? (
        <img
          src={personaje!.imagen}
          alt={personaje!.nombre}
          loading="lazy"
          draggable={false}
          onError={() => setImagenFallo(true)}
          // object-contain + tamaño 80% deja "aire" alrededor del personaje
          // para que cuerpos enteros (Homero, Marge, Krusty) queden centrados
          // y a la misma escala que los retratos tipo Bart/Lisa.
          className={cn(
            "w-[95%] h-[95%] object-contain object-center pointer-events-none drop-shadow",
            // JPEGs (jfif) tienen fondo blanco; multiply lo fusiona con bg-teal-400
            personaje!.imagen.endsWith(".jfif") && "mix-blend-multiply"
          )}
        />
      ) : (
        <span aria-hidden>{personaje?.emoji ?? "👤"}</span>
      )}
    </div>
  );
}
