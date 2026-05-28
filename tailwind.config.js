/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada en Los Simpson, en tonos vivos y amigables para niños.
        // Se mantienen las claves originales (amarillo, rojo, verde, azul, morado,
        // rosado) para no romper clases existentes, retocando sus valores.
        marca: {
          amarillo: "#FFD21E", // amarillo Simpson (piel)
          rojo: "#E8362C",     // rojo Bart/Krusty
          verde: "#6FB52E",    // verde pasto
          azul: "#2F86E0",     // azul amistoso (acciones)
          morado: "#A86BD6",
          rosado: "#FF8FB3"    // rosa dona
        },
        // Tonos de apoyo del tema.
        simpson: {
          amarillo: "#FFD21E",
          amarilloOscuro: "#E0A800", // bordes/sombras 3D del amarillo
          naranja: "#FF7A1A",        // camiseta de Bart / CTA
          naranjaOscuro: "#E0640A",
          cielo: "#7FD0F5",          // cielo del intro
          cieloClaro: "#C9ECFB",
          pasto: "#8BC34A",
          dona: "#FF8FB3",
          glaseado: "#FF6FA5",
          crema: "#FFFBEC",          // fondo de tarjetas
          tinta: "#2A2A2A"           // texto principal (contraste alto)
        }
      },
      fontFamily: {
        display: ["Baloo 2", "Fredoka", "Comic Sans MS", "system-ui", "sans-serif"],
        body: ["Nunito", "system-ui", "sans-serif"]
      },
      boxShadow: {
        // Sombra "caramelo" 3D para botones y tarjetas.
        candy: "0 6px 0 rgba(0,0,0,0.18)",
        candySm: "0 3px 0 rgba(0,0,0,0.18)"
      },
      keyframes: {
        bote: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        latido: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" }
        },
        entrada: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        brillo: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 210, 30, 0)" },
          "50%": { boxShadow: "0 0 40px 10px rgba(255, 210, 30, 0.7)" }
        },
        // Aparición tipo "pop" con rebote (caricaturesco).
        pop: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "70%": { transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        // Flotación suave y lenta (personajes, dona).
        flotar: {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-12px) rotate(2deg)" }
        },
        // Meneo juguetón al pasar el cursor / al seleccionar.
        meneo: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-6deg)" },
          "75%": { transform: "rotate(6deg)" }
        },
        // Desplazamiento horizontal de nubes a lo ancho del viewport.
        // Nota: usamos vw (no %), porque translateX en % es relativo al ancho
        // del propio elemento y dejaría las nubes amontonadas a la izquierda.
        derivar: {
          "0%": { transform: "translateX(-15vw)" },
          "100%": { transform: "translateX(115vw)" }
        },
        // Destello de chispas/sprinkles.
        destello: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.85)" },
          "50%": { opacity: "1", transform: "scale(1.15)" }
        }
      },
      animation: {
        bote: "bote 1.2s ease-in-out infinite",
        latido: "latido 1s ease-in-out infinite",
        entrada: "entrada 0.4s ease-out",
        brillo: "brillo 1.6s ease-in-out infinite",
        pop: "pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
        flotar: "flotar 3.5s ease-in-out infinite",
        meneo: "meneo 0.6s ease-in-out",
        derivar: "derivar 70s linear infinite",
        destello: "destello 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
