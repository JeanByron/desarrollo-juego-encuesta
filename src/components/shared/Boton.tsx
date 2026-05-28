import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variante = "primario" | "exito" | "peligro" | "neutro" | "amarillo";
type Tamano = "md" | "lg" | "xl";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
}

const estilosVariante: Record<Variante, string> = {
  primario: "bg-marca-azul hover:bg-blue-600 text-white",
  exito: "bg-marca-verde hover:bg-green-600 text-white",
  peligro: "bg-marca-rojo hover:bg-red-600 text-white",
  neutro: "bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200",
  amarillo: "bg-marca-amarillo hover:bg-yellow-400 text-gray-900"
};

const estilosTamano: Record<Tamano, string> = {
  md: "px-5 py-3 text-base",
  lg: "px-7 py-4 text-lg",
  xl: "px-10 py-6 text-2xl"
};

export const Boton = forwardRef<HTMLButtonElement, Props>(function Boton(
  { variante = "primario", tamano = "md", className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "rounded-2xl font-display font-bold shadow-md transition-all",
        "active:translate-y-0.5 active:shadow-sm",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
        "focus:outline-none focus:ring-4 focus:ring-white/60",
        estilosVariante[variante],
        estilosTamano[tamano],
        className
      )}
    />
  );
});
