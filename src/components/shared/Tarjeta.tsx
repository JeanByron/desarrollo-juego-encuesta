import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cn("tarjeta animate-entrada", className)} />;
}
