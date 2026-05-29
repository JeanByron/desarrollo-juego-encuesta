import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useSonidos, type Sonido } from "@/hooks/useSonidos";

type Variante = "primario" | "exito" | "peligro" | "peligroSuave" | "neutro" | "amarillo";
type Tamano = "md" | "lg" | "xl";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  /** Sonido al pulsar (por defecto un "clic"). Pasa `false` para silenciar. */
  sonido?: Sonido | false;
}

// Cada variante define color de fondo, hover y un borde inferior más oscuro
// que da el efecto 3D de botón de caramelo.
const estilosVariante: Record<Variante, string> = {
  primario: "bg-marca-azul hover:brightness-105 text-white border-b-[6px] border-blue-700",
  exito: "bg-marca-verde hover:brightness-105 text-white border-b-[6px] border-green-700",
  peligro: "bg-simpson-naranja hover:brightness-105 text-white border-b-[6px] border-simpson-naranjaOscuro",
  peligroSuave: "bg-red-400 hover:brightness-105 text-white border-b-[6px] border-red-500",
  neutro: "bg-white hover:bg-gray-50 text-gray-800 border-b-[6px] border-gray-300",
  amarillo: "bg-marca-amarillo hover:brightness-105 text-simpson-tinta border-b-[6px] border-simpson-amarilloOscuro"
};

const estilosTamano: Record<Tamano, string> = {
  md: "px-5 py-3 text-base",
  lg: "px-7 py-4 text-lg",
  xl: "px-10 py-6 text-2xl"
};

export const Boton = forwardRef<HTMLButtonElement, Props>(function Boton(
  { variante = "primario", tamano = "md", sonido = "clic", className, onClick, ...rest },
  ref
) {
  const { reproducir } = useSonidos();

  return (
    <button
      ref={ref}
      {...rest}
      onClick={(e) => {
        if (sonido) reproducir(sonido);
        onClick?.(e);
      }}
      className={cn(
        "rounded-2xl font-display font-extrabold cursor-pointer",
        "transition-all duration-150 active:translate-y-1 active:border-b-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
        "focus:outline-none focus:ring-4 focus:ring-white/70",
        estilosVariante[variante],
        estilosTamano[tamano],
        className
      )}
    />
  );
});
