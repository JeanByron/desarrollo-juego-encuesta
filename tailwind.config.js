/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marca: {
          amarillo: "#FFD93D",
          rojo: "#FF4D4D",
          verde: "#22C55E",
          azul: "#3B82F6",
          morado: "#A855F7",
          rosado: "#EC4899"
        }
      },
      fontFamily: {
        display: ["Fredoka", "Comic Sans MS", "system-ui", "sans-serif"],
        body: ["Nunito", "system-ui", "sans-serif"]
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 217, 61, 0)" },
          "50%": { boxShadow: "0 0 40px 10px rgba(255, 217, 61, 0.7)" }
        }
      },
      animation: {
        bote: "bote 1.2s ease-in-out infinite",
        latido: "latido 1s ease-in-out infinite",
        entrada: "entrada 0.4s ease-out",
        brillo: "brillo 1.6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
