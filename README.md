# Radar de Prioridades Turísticas

Web app para hacer una investigación de mercado breve con responsables de turismo municipal, provincial, nacional o entes mixtos. La herramienta permite detectar dolores, necesidades, jobs-to-be-done, problemas “hair-on-fire”, urgencia, impacto, disposición a pagar y posibles servicios vendibles.

La app está pensada para subir directo a GitHub Pages. No requiere build, npm ni servidor propio.

## Qué incluye

- `index.html`: encuesta pública.
- `admin.html`: panel privado de hallazgos, gestión de respuestas y editor de contenido.
- `styles.css`: diseño sobrio, institucional y durable.
- `survey-config.js`: configuración base editable de textos, preguntas, placeholders y opciones.
- `app.js`: lógica de la encuesta pública.
- `admin.js`: login, filtros, gráficos, scoring de oportunidades, exportación CSV, borrado de respuestas y edición de contenido.
- `config.js`: credenciales públicas de Supabase.
- `supabase_schema.sql`: tablas, índices, políticas RLS y migración para configuración editable.

## Qué mide la encuesta

1. Perfil institucional del respondente.
2. Problemas prioritarios del destino o área turística.
3. Problema “hair-on-fire”: qué resolvería primero si tuviera apoyo externo.
4. Workaround actual: cómo lo resuelven hoy.
5. Jobs-to-be-done: qué trabajo necesita que una solución haga.
6. Urgencia e impacto en escala 1 a 5.
7. Disposición a pagar, rango de presupuesto y plazo probable de contratación.
8. Servicios que tendrían sentido contratar.
9. Contacto opcional para entrevista o follow-up.

## Novedades de esta versión

### 1. Gestión de respuestas desde admin

Desde `admin.html` ahora podés:

- Ver el detalle completo de cada respuesta.
- Eliminar una respuesta puntual.
- Seleccionar varias respuestas y eliminarlas en bloque.
- Eliminar todas las respuestas filtradas, útil para limpiar pruebas.
- Exportar CSV con los textos visibles actuales de cada opción.

Para evitar accidentes, las eliminaciones masivas piden confirmación escribiendo `ELIMINAR`.

### 2. Editor de contenido de encuesta

Desde el panel admin podés modificar sin tocar código:

- Nombre de la app.
- Título principal.
- Bajadas, descripciones y textos de portada.
- Badges de cabecera.
- Títulos y subtítulos de cada sección.
- Labels de preguntas.
- Placeholders.
- Textos de ayuda.
- Opciones de problemas, JTBD, servicios, niveles, plazos, presupuesto y provincias.
- Mensaje de éxito al enviar respuesta.
- Textos del footer.

### 3. Estructura estable para reportes

La app usa IDs internos estables para las opciones. El usuario ve textos editables, pero la base guarda claves internas. Esto permite renombrar opciones sin romper hallazgos, gráficos, filtros ni exportaciones.

Regla práctica: cambiá textos visibles todo lo que quieras; no fuerces cambios de IDs internos. El panel no te los deja editar justamente para cuidar la consistencia histórica.

## Instalación en Supabase

1. Crear un proyecto en Supabase.
2. Ir a **SQL Editor**.
3. Copiar y ejecutar todo el contenido de `supabase_schema.sql`.
4. Ir a **Authentication → Users** y crear al menos un usuario admin con email y contraseña.
5. Ir a **Project Settings → API** y copiar:
   - Project URL.
   - anon public key.
6. Pegar esos valores en `config.js` si necesitás cambiarlos.

```js
window.APP_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU_ANON_PUBLIC_KEY",
  appName: "Radar de Prioridades Turísticas"
};
```

## Si ya tenías la versión anterior

También tenés que ejecutar de nuevo `supabase_schema.sql` completo. Es una migración compatible: no borra respuestas existentes.

Lo que agrega:

- Tabla `tourism_survey_config` para guardar contenido editable.
- Políticas RLS para leer configuración desde la encuesta pública.
- Permisos para que usuarios autenticados puedan editar configuración.
- Permiso para que usuarios autenticados puedan eliminar respuestas.
- Eliminación del check rígido sobre `government_level`, necesario porque ahora las opciones se administran desde el panel.

## Seguridad

El esquema usa Row Level Security:

- Cualquier visitante puede insertar una respuesta desde la encuesta pública.
- Cualquier visitante puede leer la configuración editable necesaria para renderizar la encuesta.
- Solo usuarios autenticados en Supabase pueden leer respuestas.
- Solo usuarios autenticados en Supabase pueden eliminar respuestas.
- Solo usuarios autenticados en Supabase pueden modificar el contenido editable de la encuesta.

Esto es suficiente para una V1/V2 operativa. Si la encuesta escala o se vuelve sensible, conviene sumar captcha, rate limiting y una tabla de perfiles admin con roles más estrictos.

## Publicación en GitHub Pages

1. Crear un repositorio nuevo o usar el existente.
2. Subir todos los archivos de esta carpeta.
3. Ir a **Settings → Pages**.
4. En **Build and deployment**, seleccionar:
   - Source: `Deploy from a branch`.
   - Branch: `main` / `/root`.
5. Guardar.
6. Abrir la URL pública generada por GitHub Pages.

## Uso recomendado

No mandes la encuesta de forma masiva sin segmentación. Mejor estrategia:

1. Armar una base corta de referentes con poder de decisión o influencia real.
2. Enviar un mensaje personalizado explicando que son 4–6 minutos.
3. Pedir respuestas concretas, no institucionales.
4. Revisar el panel cada 10–20 respuestas.
5. Detectar patrones: frecuencia, urgencia, impacto y señal de pago.
6. Convertir los problemas fuertes en ofertas piloto.
7. Validar esas ofertas con entrevistas cortas antes de salir a vender.

## Lectura comercial sugerida

Una oportunidad es atractiva si cumple al menos 3 de estas condiciones:

- Aparece repetida en varios destinos.
- Tiene urgencia promedio alta.
- Tiene impacto promedio alto.
- Los respondentes tienen poder de decisión o influencia.
- Hay presupuesto o posibilidad de activarlo.
- El workaround actual es manual, precario o políticamente costoso.
- El resultado esperado se puede medir.

Si un problema duele pero nadie pagaría por resolverlo, no es oferta: es conversación de café con PowerPoint. Útil, pero no factura.
