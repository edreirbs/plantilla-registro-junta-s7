# Página de registro a la junta de accionistas

Este repositorio es el material de la Actividad 1 de la Sesión 7 de Claude for Business.
El ejemplo es el registro a la **junta anual de accionistas de Waystar RoyCo**, una empresa de ficción de la serie *Succession*. La marca y los datos de la junta están en la Skill `marca-waystar`. Si la persona trae su propio evento o trámite, usa sus datos y su marca, y conserva todo lo demás.

## Qué se construye

Una página de registro, primero para celular, que se vea seria y de primer nivel:

1. **Portada:** la credencial de accionista en grande con efecto 3D (se inclina con el mouse o al mover el celular; en iPhone, pide el permiso de movimiento con `DeviceOrientationEvent.requestPermission()` al primer toque; respeta `prefers-reduced-motion`), el nombre de la junta, la fecha y el botón "Registrarme".
2. **Cuenta regresiva** a la junta, en vivo, con la fecha que da la función `datos_junta` de la base. La fecha nunca se escribe en un archivo: cambia en cada instalación.
3. **Contador:** "Ya hay N accionistas registrados", que se actualiza solo cada 15 segundos con la función `contar_asistentes`.
4. **Orden del día:** los cuatro puntos de la Skill, con íconos.
5. **Modalidad:** al tocar "En persona" o "En línea" cambia la credencial y se explica cómo se asiste.
6. **Registro:** nombre, correo, modalidad (En persona · En línea) y "Su pregunta para el consejo" (opcional, máximo 280 caracteres, con contador). Al registrarse: una animación sobria de festejo, el título "Su registro quedó", el aviso "En unos minutos le llega su confirmación" y el contador sube.
7. **Preguntas frecuentes** y el **aviso de privacidad** corto.

Nada de cifras de la empresa, votos, resultados ni declaraciones inventadas.

## Reglas de la casa

- Todo el sitio vive en `sitio/`: `index.html`, `estilos.css`, `app.js`, `config.js` y las imágenes en `sitio/img/`. HTML, CSS y JavaScript sin compilar. **No uses** frameworks, `npm` ni pasos de compilación. Solo las letras de Google Fonts que diga la Skill de marca.
- La página pesa poco: imágenes en `.webp`, sin videos. Netlify cobra créditos por cada GB que se descarga.
- **Supabase** con `fetch`, sin librerías:
  - Registrar: `POST https://<proyecto>.supabase.co/rest/v1/asistentes` con encabezados `apikey`, `Content-Type: application/json` y `Prefer: return=minimal`, y solo las columnas `nombre`, `correo`, `modalidad`, `pregunta`.
  - Contador: `POST /rest/v1/rpc/contar_asistentes`.
  - Fecha de la junta: `POST /rest/v1/rpc/datos_junta` regresa `fecha` y `cierre_registro`. Muéstralas en español y con la zona de Nueva York (día de la semana, día, mes y hora). Si la base no responde, calcula el primer jueves a 28 días o más de hoy, a las 10:00 h de Nueva York.
  - Con una llave `sb_publishable_...` no mandes `Authorization`.
  - Si el correo ya está registrado, la base responde `409` (código `23505`): dile "Ya está registrado con ese correo".
- **Seguridad:** solo la llave *publishable* va en `sitio/config.js`. Nunca la secreta (`sb_secret_...`) ni la `service_role`. La página **nunca** lee la tabla `asistentes`: el público solo puede registrarse y ver el número.
- La columna `estado_correo` (`pendiente`, `enviado`, `invalido`, `rebotado`, sin acento) la llena la tarea programada de Claude, no la página.
- Textos en español de México, de usted, con la voz de la marca. Sin guiones largos.
- Al pie de la página va esta leyenda: "Material de ficción con fines educativos. Personajes y empresas de la serie Succession (HBO). Sin afiliación con HBO ni con sus titulares."

## La base de datos

- `supabase/esquema.sql` crea la tabla, sus permisos, el contador y el aviso a Claude. Se corre una vez con el conector de Supabase en el proyecto que diga la persona.
- `supabase/tarea_correos.md` trae el prompt de la tarea programada que manda los correos de confirmación y cómo conectarla.
- El asesor de seguridad de Supabase avisa que el público puede ejecutar `contar_asistentes` y `datos_junta`. Es a propósito: una regresa el número y la otra, la fecha.

## Cómo se trabaja

- Cada cambio va en una rama y se revisa en la vista previa del Pull Request. **Nunca** directo en `main`: cada publicación de `main` en Netlify gasta créditos.
- Antes de abrir el Pull Request, pide al subagente `revisor-seguridad` que revise.
- `respaldo/sitio/` es una página terminada y probada. **No** la copies ni la leas para construir, salvo que la persona lo pida ("usa el respaldo").
