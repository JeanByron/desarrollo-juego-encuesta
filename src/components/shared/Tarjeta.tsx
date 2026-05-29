import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Tarjeta = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Tarjeta({ className, ...rest }, ref) {
    return <div ref={ref} {...rest} className={cn("tarjeta animate-pop", className)} />;
  }
);
