import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Podio } from "@/components/shared/Podio";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import { ConfettiCelebration } from "@/components/shared/ConfettiCelebration";
import type { Jugador, Partida } from "@/types/database";

interface Props {
  partida: Partida;
  jugadores: Jugador[];
  terminando?: boolean;
  onTerminar: () => void;
}

export function PantallaFinalAdmin({ partida, jugadores, terminando, onTerminar }: Props) {
  const podioRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);

  // Confeti se muestra durante la animación de revelación del podio (~4 s).
  const [confeti, setConfeti] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setConfeti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const descargarPantallazo = async () => {
    if (!podioRef.current) return;
    setDescargando(true);
    try {
      const canvas = await html2canvas(podioRef.current, {
        backgroundColor: "#FFFBEC", // crema, igual que las tarjetas
        scale: 2, // mayor resolución
        useCORS: true,
        logging: false,
        // html2canvas clona el DOM y reinicia las animaciones CSS (que arrancan
        // en opacidad 0), por eso la captura salía desvaída. Las desactivamos en
        // el clon para que se vea con colores plenos.
        onclone: (_doc, el) => {
          el.style.animation = "none";
          el.querySelectorAll<HTMLElement>("*").forEach((n) => {
            n.style.animation = "none";
            n.style.transition = "none";
          });
        }
      });
      const enlace = document.createElement("a");
      const fecha = new Date().toISOString().slice(0, 10);
      enlace.download = `ganadores-${fecha}.png`;
      enlace.href = canvas.toDataURL("image/png");
      enlace.click();
    } finally {
      setDescargando(false);
    }
  };

  // Exporta el ranking (posición, nombre, puntos) a un archivo Excel.
  const exportarExcel = () => {
    const orden = [...jugadores].sort((a, b) => b.puntos - a.puntos);
    const filas = orden.map((j, i) => ({
      Posición: i + 1,
      Nombre: j.nombre,
      Puntos: j.puntos
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 10 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Resultados");
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `resultados-${fecha}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Confeti celebratorio durante la revelación del podio */}
      {confeti && <ConfettiCelebration />}

      {/* Tarjeta que se captura en el pantallazo */}
      <Tarjeta ref={podioRef} className="text-center space-y-4">
        <h2 className="font-display text-3xl md:text-5xl text-marca-rojo animate-pop">
          🏆 ¡Ganadores! 🏆
        </h2>
        <Podio jugadores={jugadores} />
        <p className="text-sm text-gray-500">
          {partida.fecha_fin
            ? `Partida del ${new Date(partida.fecha_fin).toLocaleDateString()}`
            : "Partida finalizada"}
        </p>
      </Tarjeta>

      {/* Acciones: descargar pantallazo y, a su derecha, terminar partida */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Boton
          variante="primario"
          tamano="lg"
          onClick={descargarPantallazo}
          disabled={descargando || jugadores.length === 0}
        >
          {descargando ? "Generando..." : "📸 Descargar pantallazo"}
        </Boton>
        <Boton
          variante="exito"
          tamano="lg"
          onClick={exportarExcel}
          disabled={jugadores.length === 0}
        >
          📊 Exportar a Excel
        </Boton>
        <Boton
          variante="peligro"
          tamano="lg"
          onClick={onTerminar}
          disabled={terminando}
        >
          {terminando ? "Terminando..." : "🏁 Terminar partida"}
        </Boton>
      </div>

      <Tarjeta>
        <h3 className="font-display text-xl mb-3">Ranking final</h3>
        <TablaPuntajes jugadores={jugadores} />
      </Tarjeta>
    </div>
  );
}

