import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  ancho?: "estrecho" | "medio" | "ancho";
}

export function Layout({ children, className, ancho = "medio" }: Props) {
  const max =
    ancho === "estrecho" ? "max-w-md" : ancho === "ancho" ? "max-w-6xl" : "max-w-3xl";
  return (
    <main className={cn("min-h-full px-4 py-8 mx-auto w-full", max, className)}>
      {children}
    </main>
  );
}
