# CLAUDE.md

Guía cargada en cada sesión de Claude Code para este repositorio.

## Proyecto

**kahoot-cultura-general** — juego web educativo estilo Kahoot (cultura general, multijugador en tiempo real).

**Stack (web, NO móvil):**
- React 18 + TypeScript
- Vite (dev/build) · Tailwind CSS 3
- Supabase (`@supabase/supabase-js`) — backend/realtime/auth
- TanStack React Query · Zustand · React Router
- Comandos: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`

## Skills de diseño: ÚSALAS SIEMPRE

Este repo tiene instaladas las skills de **ui-ux-pro-max v2.5.0** en [.claude/skills/](.claude/skills/).
**Para cualquier trabajo de UI, UX, diseño visual, estilos, layout, color, tipografía, componentes o accesibilidad, usa estas skills antes de escribir o modificar el código de la interfaz.** No diseñes "a ojo": consulta primero la base de conocimiento.

Skills disponibles:
- **ui-ux-pro-max** — inteligencia de diseño principal (estilos, paletas, tipografías, patrones de landing, UX, charts). Punto de partida.
- **design-system** — design tokens, componentes, integración con Tailwind.
- **ui-styling** — decisiones de estilo de UI.
- **brand** — identidad de marca, paletas, guías visuales.
- **design** · **banner-design** · **slides** — diseño gráfico, banners y slides.

### Cómo invocar ui-ux-pro-max (correcto para este proyecto web)

El script de búsqueda está en `.claude/skills/ui-ux-pro-max/scripts/search.py` (requiere Python 3, ya disponible como `python`).

**Empieza siempre por un design system completo** para la pantalla/feature que vas a construir:

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "<tipo de producto> <industria> <keywords>" --design-system -p "Kahoot Cultura General"
```

Búsquedas por dominio (todas aplican a web, son agnósticas de plataforma):

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <dominio> [-n N]
```
Dominios útiles aquí: `style`, `color`, `typography`, `landing`, `product`, `ux`, `chart`, `icons`, `web`, `google-fonts`.
Para rendimiento de React web: `--domain react` (devuelve guías React/Next.js).

### IMPORTANTE — este build es la variante React Native

El archivo v2.5.0 que se instaló viene con la variante **React Native** del skill. Por eso:
- **Ignora** el paso "Step 4: Stack Guidelines" y la opción `--stack react-native` del `SKILL.md` — NO aplica a este proyecto web.
- **Ignora** los "Scope notice" y checklists de App UI (iOS/Android/React Native) — son para apps móviles.
- **Sí usa** todas las búsquedas por `--domain` y `--design-system`: el conocimiento de estilos, color, tipografía, landing, producto, UX y charts es válido para web.
- Traduce siempre las recomendaciones al stack real: **React + TypeScript + Tailwind CSS** (clases utilitarias), no a estilos de React Native.
