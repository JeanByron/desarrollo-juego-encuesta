import { FormEvent, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import {
  useActualizarPregunta,
  useCrearPregunta,
  useEliminarPregunta,
  useImportarPreguntas,
  usePreguntas
} from "@/hooks/usePreguntas";
import type { Pregunta } from "@/types/database";

interface FormState {
  id?: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  nivel: number;
  activa: boolean;
}

const FORM_VACIO: FormState = {
  pregunta: "",
  respuesta: "",
  categoria: "General",
  nivel: 1,
  activa: true
};

export function GestorPreguntas() {
  const { data: preguntas = [], isLoading } = usePreguntas();
  const crear = useCrearPregunta();
  const actualizar = useActualizarPregunta();
  const eliminar = useEliminarPregunta();
  const importar = useImportarPreguntas();

  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [filtro, setFiltro] = useState("");
  const inputArchivo = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [resultadoImport, setResultadoImport] = useState<string | null>(null);

  const editando = !!form.id;

  const categorias = useMemo(() => {
    const set = new Set(preguntas.map((p) => p.categoria));
    return ["General", ...Array.from(set).filter((c) => c !== "General")].slice(0, 12);
  }, [preguntas]);

  const preguntasFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return preguntas;
    return preguntas.filter(
      (p) =>
        p.pregunta.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        (p.respuesta ?? "").toLowerCase().includes(q)
    );
  }, [preguntas, filtro]);

  const onGuardar = (e: FormEvent) => {
    e.preventDefault();
    const datos = {
      pregunta: form.pregunta.trim(),
      respuesta: form.respuesta.trim() || null,
      categoria: form.categoria.trim() || "General",
      nivel: form.nivel,
      activa: form.activa
    };
    if (!datos.pregunta) return;

    if (editando && form.id) {
      actualizar.mutate({ id: form.id, ...datos }, { onSuccess: () => setForm(FORM_VACIO) });
    } else {
      crear.mutate(datos, { onSuccess: () => setForm(FORM_VACIO) });
    }
  };

  const editar = (p: Pregunta) => {
    setForm({
      id: p.id,
      pregunta: p.pregunta,
      respuesta: p.respuesta ?? "",
      categoria: p.categoria,
      nivel: p.nivel,
      activa: p.activa
    });
    // El formulario está arriba; llevamos la vista hasta él para que se note.
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onArchivo = async (file: File) => {
    setResultadoImport("Procesando archivo...");
    try {
      const filas = await leerArchivo(file);
      const r = await importar.mutateAsync(filas);
      setResultadoImport(`✅ Insertadas ${r.insertados} preguntas.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResultadoImport(`❌ Error al importar: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      <Tarjeta ref={formRef} className="space-y-4">
        <h2 className="font-display text-2xl">
          {editando ? "✏️ Editar pregunta" : "➕ Nueva pregunta"}
        </h2>
        <form onSubmit={onGuardar} className="space-y-3">
          <textarea
            value={form.pregunta}
            onChange={(e) => setForm((s) => ({ ...s, pregunta: e.target.value }))}
            placeholder="¿Cuál es la capital de...?"
            className="w-full rounded-2xl border-2 border-yellow-300 px-4 py-3 min-h-[5rem]"
            required
          />
          <textarea
            value={form.respuesta}
            onChange={(e) => setForm((s) => ({ ...s, respuesta: e.target.value }))}
            placeholder="Respuesta (opcional, solo la ves tú)"
            className="w-full rounded-2xl border-2 border-yellow-300 px-4 py-3 min-h-[4rem]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              list="categorias-existentes"
              value={form.categoria}
              onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value }))}
              placeholder="Categoría"
              className="rounded-2xl border-2 border-yellow-300 px-4 py-3"
            />
            <datalist id="categorias-existentes">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <select
              value={form.nivel}
              onChange={(e) => setForm((s) => ({ ...s, nivel: Number(e.target.value) }))}
              className="rounded-2xl border-2 border-yellow-300 px-4 py-3"
            >
              <option value={1}>Nivel 1 — 100 pts</option>
              <option value={2}>Nivel 2 — 200 pts</option>
              <option value={3}>Nivel 3 — 300 pts</option>
              <option value={4}>Nivel 4 — 400 pts</option>
              <option value={5}>Nivel 5 — 500 pts</option>
            </select>
            <label className="flex items-center gap-2 rounded-2xl border-2 border-yellow-300 px-4 py-3">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm((s) => ({ ...s, activa: e.target.checked }))}
              />
              <span>Activa en el banco</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Boton type="submit" variante="exito" tamano="lg">
              {editando ? "Guardar cambios" : "Crear pregunta"}
            </Boton>
            {editando && (
              <Boton type="button" variante="neutro" onClick={() => setForm(FORM_VACIO)}>
                Cancelar
              </Boton>
            )}
          </div>
        </form>
      </Tarjeta>

      <Tarjeta className="space-y-3">
        <h2 className="font-display text-2xl">📥 Importación masiva</h2>
        <p className="text-sm text-gray-600">
          Sube un archivo <strong>.csv</strong>, <strong>.xlsx</strong> o{" "}
          <strong>.xls</strong>. La primera fila debe contener encabezados:{" "}
          <code>pregunta, respuesta, categoria, nivel</code>. Solo{" "}
          <code>pregunta</code> es obligatorio.
        </p>
        <input
          ref={inputArchivo}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onArchivo(f);
            e.target.value = "";
          }}
          className="block"
        />
        {resultadoImport && <p className="text-sm">{resultadoImport}</p>}
      </Tarjeta>

      <Tarjeta>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-2xl">Banco de preguntas</h2>
          <input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar..."
            className="rounded-full border-2 border-yellow-300 px-3 py-1 text-sm"
          />
        </div>
        {isLoading ? (
          <p className="italic text-gray-500">Cargando...</p>
        ) : (
          <ul className="divide-y">
            {preguntasFiltradas.map((p) => (
              <li key={p.id} className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{p.pregunta}</p>
                  {p.respuesta && (
                    <p className="text-sm text-gray-600">→ {p.respuesta}</p>
                  )}
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="rounded-full bg-marca-azul text-white px-2 py-0.5">
                      {p.categoria}
                    </span>
                    <span className="rounded-full bg-marca-morado text-white px-2 py-0.5">
                      Nivel {p.nivel} · {p.nivel * 100} pts
                    </span>
                    {!p.activa && (
                      <span className="rounded-full bg-gray-300 text-gray-700 px-2 py-0.5">
                        inactiva
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Boton variante="neutro" onClick={() => editar(p)}>
                    ✏️
                  </Boton>
                  <Boton
                    variante="peligroSuave"
                    onClick={() => {
                      if (confirm(`¿Eliminar la pregunta "${p.pregunta.slice(0, 40)}..."?`)) {
                        eliminar.mutate(p.id);
                      }
                    }}
                  >
                    🗑
                  </Boton>
                </div>
              </li>
            ))}
            {preguntasFiltradas.length === 0 && (
              <li className="py-6 text-center italic text-gray-500">Sin resultados.</li>
            )}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers para leer CSV / XLSX en cliente
// ---------------------------------------------------------------------------
async function leerArchivo(
  file: File
): Promise<Array<{ pregunta: string; respuesta?: string; categoria?: string; nivel?: number }>> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data as never),
        error: reject
      });
    });
  }
  // Excel
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" }) as never;
}
