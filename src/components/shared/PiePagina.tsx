import { cn } from "@/lib/utils";

// Pie de página: "Creado por:" en gris junto al logo del creador.
export function PiePagina({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "w-full pt-8 pb-1 flex items-center justify-center gap-2 text-gray-500",
        className
      )}
    >
      <span className="text-sm font-bold">Creado por:</span>
      <img
        src="/logo.png"
        alt="Logo del creador"
        className="h-[72px] w-auto object-contain drop-shadow-sm"
      />
    </footer>
  );
}
