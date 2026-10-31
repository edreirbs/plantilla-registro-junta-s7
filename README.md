# Registro a la junta de accionistas

Material de la **Actividad 1 de la Sesión 7** de *Claude for Business*.

El ejemplo es el registro a la **junta anual de accionistas de Waystar RoyCo**, una empresa de ficción de la serie *Succession*. Puedes usar tu propio evento o trámite: dile a Claude cuál es y con qué marca.

## Qué hay aquí

| Carpeta o archivo | Para qué |
|---|---|
| `CLAUDE.md` | Lo que Claude necesita saber para construir la página |
| `.claude/skills/marca-waystar/` | Skill con la marca y los datos de la junta |
| `.claude/agents/revisor-seguridad.md` | Subagente que revisa la página antes del Pull Request; solo puede leer |
| `supabase/esquema.sql` | La tabla de asistentes, sus permisos, el contador y el aviso a Claude |
| `supabase/tarea_correos.md` | El prompt de la tarea programada que manda los correos de confirmación |
| `sitio/` | Lo que publica Netlify. Aquí construye Claude la página. Ya trae las imágenes en `sitio/img/` |
| `respaldo/sitio/` | Una página terminada y probada, por si la tuya no queda |
| `netlify.toml` | Le dice a Netlify que publique la carpeta `sitio/` |

## Regla de oro con Netlify

Cada publicación de `main` gasta créditos del plan gratis. Los cambios se hacen en una rama y se revisan en la vista previa del Pull Request, que es gratis. Se fusiona una sola vez, cuando ya quedó.

---

Material de ficción con fines educativos. Personajes y empresas de la serie Succession (HBO). Sin afiliación con HBO ni con sus titulares.
