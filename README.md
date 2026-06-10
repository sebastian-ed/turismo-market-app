# Radar de Prioridades Turísticas

Web app para hacer una investigación de mercado breve con responsables de turismo municipal, provincial, nacional o entes mixtos. La herramienta permite detectar dolores, necesidades, jobs-to-be-done, problemas “hair-on-fire”, urgencia, impacto, disposición a pagar y posibles servicios vendibles.

La app está pensada para subir directo a GitHub Pages. No requiere build, npm ni servidor propio.

## Qué incluye

- `index.html`: encuesta pública.
- `admin.html`: panel privado de hallazgos.
- `styles.css`: diseño sobrio, institucional y durable.
- `app.js`: lógica de la encuesta.
- `admin.js`: login, filtros, gráficos, scoring de oportunidades y exportación CSV.
- `config.js`: credenciales públicas de Supabase.
- `supabase_schema.sql`: tabla, índices y políticas RLS.

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

## Panel admin

El panel muestra automáticamente:

- Total de respuestas.
- Jurisdicciones relevadas.
- Urgencia promedio.
- Señal de pago.
- Problemas más frecuentes.
- Servicios más demandados.
- Distribución de disposición a pagar.
- Matriz urgencia vs impacto.
- Oportunidades priorizadas con score comercial.
- Palabras frecuentes en respuestas abiertas.
- Frases “hair-on-fire” más fuertes.
- Tabla de respuestas individuales.
- Exportación CSV.

## Instalación en Supabase

1. Crear un proyecto en Supabase.
2. Ir a **SQL Editor**.
3. Copiar y ejecutar todo el contenido de `supabase_schema.sql`.
4. Ir a **Authentication → Users** y crear al menos un usuario admin con email y contraseña.
5. Ir a **Project Settings → API** y copiar:
   - Project URL.
   - anon public key.
6. Pegar esos valores en `config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU_ANON_PUBLIC_KEY",
  appName: "Radar de Prioridades Turísticas"
};
```

## Seguridad

El esquema usa Row Level Security:

- Cualquier visitante puede insertar una respuesta desde la encuesta pública.
- Solo usuarios autenticados en Supabase pueden leer resultados en el panel admin.
- No hay políticas públicas de lectura, edición ni borrado.

Esto es suficiente para una V1. Si la encuesta escala o se vuelve sensible, conviene sumar captcha, rate limiting y una tabla de perfiles admin con roles más estrictos.

## Publicación en GitHub Pages

1. Crear un repositorio nuevo.
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
