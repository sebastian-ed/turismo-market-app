/*
  Configuración editable de encuesta.
  Regla de arquitectura: los IDs internos de opciones se mantienen estables.
  Podés cambiar labels, ayudas, títulos y placeholders desde el panel admin sin romper reportes.
*/
(function () {
  const DEFAULT_SURVEY_CONFIG = {
    version: 2,
    page: {
      appName: 'Radar de Prioridades Turísticas',
      documentTitle: 'Radar de Prioridades Turísticas',
      metaDescription: 'Encuesta ejecutiva para detectar dolores, prioridades y oportunidades de servicios turísticos para organismos públicos.',
      navAdminLabel: 'Panel admin',
      eyebrow: 'Investigación ejecutiva · turismo público',
      heroTitle: 'Detectar problemas reales antes de diseñar soluciones.',
      heroLead: 'Una encuesta breve para responsables de turismo municipal, provincial y nacional. El objetivo es identificar dolores concretos, urgencia, impacto y disposición a contratar servicios que resuelvan problemas prioritarios.',
      badges: ['4–6 minutos', 'Respuestas confidenciales', 'Enfoque operativo'],
      briefTitle: 'Qué buscamos entender',
      briefText: 'Qué les duele hoy, qué intentaron hacer, qué resultado necesitan mostrar y qué tipo de solución estarían dispuestos a contratar.',
      briefFootnote: 'No es una encuesta de satisfacción. Es una lectura de mercado para priorizar servicios con demanda real.',
      footerLeft: 'Radar de Prioridades Turísticas',
      footerRight: 'Investigación de mercado para servicios turísticos públicos.',
      submitTitle: 'Enviar respuesta',
      submitHelp: 'Los datos se registran en Supabase y alimentan el panel de hallazgos.',
      submitButton: 'Enviar encuesta',
      successMessage: 'Respuesta registrada. Gracias por aportar información útil para priorizar soluciones.'
    },
    admin: {
      title: 'Panel admin · Radar de Prioridades Turísticas',
      subtitle: 'Panel admin de hallazgos y oportunidades',
      loginEyebrow: 'Acceso privado',
      loginTitle: 'Ingresar al panel admin',
      loginText: 'Usá un usuario creado en Supabase Auth. La encuesta es pública; la lectura y gestión de resultados queda restringida.',
      loginHelp: 'Si todavía no tenés usuario admin, crealo en Supabase → Authentication → Users.'
    },
    sections: [
      { id: 'profile', number: '1', title: 'Perfil institucional', description: 'Lo mínimo para segmentar respuestas sin volver pesada la encuesta.' },
      { id: 'problems', number: '2', title: 'Problemas prioritarios', description: 'Elegí hasta 4. La restricción fuerza foco; sin foco, no hay oportunidad comercial.' },
      { id: 'jtbd', number: '3', title: 'Hair-on-fire y JTBD', description: 'Acá aparece el problema que realmente compra. Lo demás suele ser decorado institucional.' },
      { id: 'purchase', number: '4', title: 'Urgencia, impacto y compra', description: 'Sin urgencia ni presupuesto, el dolor puede ser real pero no necesariamente vendible.' },
      { id: 'solutions', number: '5', title: 'Soluciones que tendrían sentido', description: 'Elegí hasta 4 posibles servicios. Esto orienta el portfolio, no lo encorseta.' },
      { id: 'contact', number: '6', title: 'Contacto opcional', description: 'Solo para profundizar hallazgos. No bloquea la respuesta.' }
    ],
    fields: {
      jurisdiction_name: { label: 'Nombre del destino / jurisdicción', placeholder: 'Ej. San Martín de los Andes' },
      province: { label: 'Provincia', firstOption: 'Seleccionar...' },
      government_level: {
        label: 'Nivel de gobierno',
        firstOption: 'Seleccionar...',
        options: [
          { id: 'municipal', label: 'Municipal', active: true },
          { id: 'provincial', label: 'Provincial', active: true },
          { id: 'nacional', label: 'Nacional', active: true },
          { id: 'ente_mixto_publico_privado', label: 'Ente mixto / público-privado', active: true },
          { id: 'otro', label: 'Otro', active: true }
        ]
      },
      destination_type: {
        label: 'Tipo de destino',
        firstOption: 'Seleccionar...',
        options: [
          { id: 'urbano_city_break', label: 'Urbano / city break', active: true },
          { id: 'naturaleza_aventura', label: 'Naturaleza / aventura', active: true },
          { id: 'cultural_patrimonial', label: 'Cultural / patrimonial', active: true },
          { id: 'rural_pueblos', label: 'Rural / pueblos', active: true },
          { id: 'sol_y_playa', label: 'Sol y playa', active: true },
          { id: 'eventos_reuniones', label: 'Eventos / reuniones', active: true },
          { id: 'mixto', label: 'Mixto', active: true }
        ]
      },
      decision_role: {
        label: 'Tu rol en decisiones de contratación',
        firstOption: 'Seleccionar...',
        options: [
          { id: 'decido_directamente', label: 'Decido directamente', active: true },
          { id: 'influyo_fuertemente', label: 'Influyo fuertemente', active: true },
          { id: 'recomiendo_tecnicamente', label: 'Recomiendo técnicamente', active: true },
          { id: 'ejecuto_no_decido_presupuesto', label: 'Ejecuto, pero no decido presupuesto', active: true },
          { id: 'otro', label: 'Otro', active: true }
        ]
      },
      role_title: { label: 'Cargo / función', placeholder: 'Ej. Director/a de Turismo' },
      organization: { label: 'Organismo / área', placeholder: 'Ej. Secretaría de Turismo' },
      top_problems: {
        label: '¿Qué problemas pesan más hoy en tu gestión turística?',
        helpText: 'Máximo 4 opciones.',
        max: 4,
        errorText: 'Seleccioná entre 1 y 4 problemas.',
        otherLabel: 'Otro problema relevante',
        otherPlaceholder: 'Describilo en pocas palabras',
        options: [
          { id: 'falta_datos_confiables', label: 'Falta de datos confiables para decidir', help: 'No hay evidencia clara para priorizar acciones.', active: true },
          { id: 'baja_coordinacion_publico_privada', label: 'Baja coordinación público-privada', help: 'Cuesta alinear actores, cámaras, prestadores y gobierno.', active: true },
          { id: 'promocion_baja_conversion', label: 'Promoción con baja conversión en demanda', help: 'Se comunica, pero no se traduce en visitantes o ventas.', active: true },
          { id: 'estacionalidad_baja_ocupacion', label: 'Estacionalidad / baja ocupación fuera de temporada', help: 'Demanda concentrada y meses débiles.', active: true },
          { id: 'falta_presupuesto_financiamiento', label: 'Falta de presupuesto o financiamiento', help: 'Hay ideas, pero no fondos o proyectos armados.', active: true },
          { id: 'escasa_medicion_impacto_economico', label: 'Escasa medición de impacto económico', help: 'No se puede demostrar retorno o resultados.', active: true },
          { id: 'oferta_poco_comercializable', label: 'Oferta turística poco empaquetada o comercializable', help: 'Experiencias dispersas, difíciles de vender.', active: true },
          { id: 'debil_presencia_digital', label: 'Débil presencia digital del destino', help: 'Web, redes, SEO, datos o contenidos insuficientes.', active: true },
          { id: 'falta_capacitacion', label: 'Falta de capacitación en equipos o prestadores', help: 'Brechas de gestión, atención, comercialización o calidad.', active: true },
          { id: 'dificultad_captar_eventos_inversiones', label: 'Dificultad para captar eventos o inversiones', help: 'Falta pipeline, propuesta o estrategia comercial.', active: true },
          { id: 'gobernanza_consensos_fragiles', label: 'Gobernanza y consensos frágiles', help: 'La agenda depende demasiado del cambio político.', active: true },
          { id: 'otro', label: 'Otro', help: 'Algo relevante que no aparece en la lista.', active: true }
        ]
      },
      hair_on_fire: { label: 'Si mañana consiguieras apoyo externo, ¿qué problema resolverías primero?', placeholder: 'Ej. Necesitamos justificar prioridades de inversión con datos porque el presupuesto se define en 30 días.' },
      current_workaround: { label: '¿Cómo lo están resolviendo hoy?', placeholder: 'Ej. Excel, reuniones, intuición, informes manuales, consultorías aisladas...' },
      success_metric: { label: '¿Qué resultado tendrías que mostrar para decir “esto funcionó”?', placeholder: 'Ej. más ocupación fuera de temporada, mejores reportes, consenso privado, proyectos financiados...' },
      jobs_to_be_done: {
        label: '¿Qué trabajo necesitás que una solución haga por vos?',
        options: [
          { id: 'justificar_prioridades', label: 'Justificar prioridades ante decisores', help: 'Necesito evidencia para defender decisiones.', active: true },
          { id: 'ordenar_informacion', label: 'Ordenar información dispersa', help: 'Necesito convertir datos sueltos en lectura ejecutiva.', active: true },
          { id: 'conseguir_consenso_privados', label: 'Conseguir consenso con privados', help: 'Necesito alinear intereses y compromisos.', active: true },
          { id: 'mostrar_resultados_gestion', label: 'Mostrar resultados de gestión', help: 'Necesito reportes claros y defendibles.', active: true },
          { id: 'diagnostico_a_plan_operativo', label: 'Convertir diagnóstico en plan operativo', help: 'Necesito pasar de ideas a ejecución.', active: true },
          { id: 'priorizar_inversiones', label: 'Priorizar inversiones y proyectos', help: 'Necesito elegir dónde poner recursos escasos.', active: true },
          { id: 'reducir_intuicion_politica', label: 'Reducir dependencia de intuición política', help: 'Necesito decisiones más técnicas y menos reactivas.', active: true },
          { id: 'profesionalizar_promocion', label: 'Profesionalizar promoción y comercialización', help: 'Necesito mejorar la captura de demanda.', active: true }
        ]
      },
      urgency: { label: 'Urgencia del problema principal', leftHelp: 'Baja', rightHelp: 'Alta / crítica' },
      impact: { label: 'Impacto si se resolviera', leftHelp: 'Menor', rightHelp: 'Alto impacto político/técnico' },
      willingness_to_pay: {
        label: 'Disposición a pagar / contratar',
        firstOption: 'Seleccionar...',
        options: [
          { id: 'si_presupuesto_o_puedo_activarlo', label: 'Sí, tengo presupuesto o puedo activarlo', active: true },
          { id: 'probablemente_si_prioritario', label: 'Probablemente, si el problema es prioritario', active: true },
          { id: 'necesitaria_validacion', label: 'Necesitaría validación política/técnica', active: true },
          { id: 'hoy_no_hay_presupuesto', label: 'Hoy no hay presupuesto', active: true },
          { id: 'no_contrataria_apoyo_externo', label: 'No contrataría apoyo externo', active: true }
        ]
      },
      budget_range: {
        label: 'Rango mensual/proyecto estimado',
        firstOption: 'No sabe / no responde',
        options: [
          { id: 'hasta_usd_500', label: 'Hasta USD 500', active: true },
          { id: 'usd_500_1500', label: 'USD 500–1.500', active: true },
          { id: 'usd_1500_3000', label: 'USD 1.500–3.000', active: true },
          { id: 'usd_3000_7000', label: 'USD 3.000–7.000', active: true },
          { id: 'mas_de_usd_7000', label: 'Más de USD 7.000', active: true },
          { id: 'depende_licitacion', label: 'Depende de licitación / contratación pública', active: true }
        ]
      },
      buying_timeline: {
        label: 'Cuándo podría contratarse algo así',
        firstOption: 'Seleccionar...',
        options: [
          { id: '0_30_dias', label: '0–30 días', active: true },
          { id: '1_3_meses', label: '1–3 meses', active: true },
          { id: '3_6_meses', label: '3–6 meses', active: true },
          { id: 'proximo_presupuesto_anual', label: 'Próximo presupuesto anual', active: true },
          { id: 'no_esta_en_agenda', label: 'No está en agenda', active: true }
        ]
      },
      desired_services: {
        label: '¿Qué tipo de apoyo externo sería más útil?',
        helpText: 'Máximo 4 opciones.',
        max: 4,
        otherLabel: 'Otro servicio potencial',
        otherPlaceholder: 'Describilo en pocas palabras',
        options: [
          { id: 'diagnostico_estrategico', label: 'Diagnóstico estratégico del destino', help: 'Mapa de problemas, brechas y oportunidades.', active: true },
          { id: 'observatorio_tablero_inteligencia', label: 'Observatorio / tablero de inteligencia turística', help: 'Datos, indicadores y reportes automáticos.', active: true },
          { id: 'diseno_productos_experiencias', label: 'Diseño de productos y experiencias', help: 'Oferta vendible, segmentada y empaquetada.', active: true },
          { id: 'plan_marketing_captacion', label: 'Plan de marketing y captación de demanda', help: 'Estrategia, contenidos, canales y medición.', active: true },
          { id: 'facilitacion_mesas_publico_privadas', label: 'Facilitación de mesas público-privadas', help: 'Consensos, agenda común y gobernanza.', active: true },
          { id: 'formulacion_proyectos_financiamiento', label: 'Formulación de proyectos y financiamiento', help: 'Carpetas, programas, fondos y priorización.', active: true },
          { id: 'capacitacion_equipos_prestadores', label: 'Capacitación a equipos y prestadores', help: 'Gestión, calidad, atención y comercialización.', active: true },
          { id: 'reportes_ejecutivos_automaticos', label: 'Sistema de reportes ejecutivos automáticos', help: 'Informes periódicos listos para decisión política.', active: true },
          { id: 'medicion_impacto_roi', label: 'Medición de impacto / ROI turístico', help: 'Evidencia de resultados económicos y sociales.', active: true },
          { id: 'auditoria_digital_destino', label: 'Auditoría digital del destino', help: 'Web, redes, buscadores, reputación y funnel.', active: true },
          { id: 'otro', label: 'Otro', help: 'Un servicio no listado.', active: true }
        ]
      },
      desired_service_other: { label: 'Otro servicio potencial', placeholder: 'Describilo en pocas palabras' },
      evidence_notes: { label: 'Algo más que ayude a entender el problema', placeholder: 'Contexto, trabas, indicadores, tensiones, restricciones de contratación, etc.' },
      respondent_name: { label: 'Nombre', placeholder: 'Opcional' },
      email: { label: 'Email', placeholder: 'Opcional' },
      phone: { label: 'Teléfono / WhatsApp', placeholder: 'Opcional' },
      contact_ok: { label: 'Acepto que me contacten para ampliar la respuesta o compartir conclusiones generales del relevamiento.' },
      province_options: {
        options: [
          { id: 'Buenos Aires', label: 'Buenos Aires', active: true },
          { id: 'CABA', label: 'CABA', active: true },
          { id: 'Catamarca', label: 'Catamarca', active: true },
          { id: 'Chaco', label: 'Chaco', active: true },
          { id: 'Chubut', label: 'Chubut', active: true },
          { id: 'Córdoba', label: 'Córdoba', active: true },
          { id: 'Corrientes', label: 'Corrientes', active: true },
          { id: 'Entre Ríos', label: 'Entre Ríos', active: true },
          { id: 'Formosa', label: 'Formosa', active: true },
          { id: 'Jujuy', label: 'Jujuy', active: true },
          { id: 'La Pampa', label: 'La Pampa', active: true },
          { id: 'La Rioja', label: 'La Rioja', active: true },
          { id: 'Mendoza', label: 'Mendoza', active: true },
          { id: 'Misiones', label: 'Misiones', active: true },
          { id: 'Neuquén', label: 'Neuquén', active: true },
          { id: 'Río Negro', label: 'Río Negro', active: true },
          { id: 'Salta', label: 'Salta', active: true },
          { id: 'San Juan', label: 'San Juan', active: true },
          { id: 'San Luis', label: 'San Luis', active: true },
          { id: 'Santa Cruz', label: 'Santa Cruz', active: true },
          { id: 'Santa Fe', label: 'Santa Fe', active: true },
          { id: 'Santiago del Estero', label: 'Santiago del Estero', active: true },
          { id: 'Tierra del Fuego', label: 'Tierra del Fuego', active: true },
          { id: 'Tucumán', label: 'Tucumán', active: true }
        ]
      }
    }
  };

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function mergeDeep(base, incoming) {
    const output = deepClone(base);
    mergeInto(output, incoming || {});
    return output;
  }

  function mergeInto(target, source) {
    Object.keys(source || {}).forEach(key => {
      if (Array.isArray(source[key])) {
        target[key] = source[key];
      } else if (isObject(source[key]) && isObject(target[key])) {
        mergeInto(target[key], source[key]);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    });
  }

  function getPath(object, path, fallback = '') {
    return String(path || '').split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), object) ?? fallback;
  }

  function setPath(object, path, value) {
    const parts = String(path || '').split('.');
    const last = parts.pop();
    const target = parts.reduce((acc, part) => {
      if (!acc[part] || typeof acc[part] !== 'object') acc[part] = {};
      return acc[part];
    }, object);
    target[last] = value;
  }

  function slugify(value, fallback = 'opcion') {
    const slug = String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    return slug || `${fallback}_${Date.now().toString(36)}`;
  }

  function getOptions(config, fieldKey, onlyActive = false) {
    const field = config?.fields?.[fieldKey];
    const options = Array.isArray(field?.options) ? field.options : [];
    return onlyActive ? options.filter(option => option.active !== false) : options;
  }

  function findOption(config, fieldKey, value) {
    const raw = String(value ?? '');
    const normalizedRaw = normalize(raw);
    return getOptions(config, fieldKey, false).find(option => {
      const legacyLabels = Array.isArray(option.legacyLabels) ? option.legacyLabels : [];
      return String(option.id) === raw
        || normalize(option.label) === normalizedRaw
        || legacyLabels.some(label => normalize(label) === normalizedRaw);
    });
  }

  function optionLabel(config, fieldKey, value) {
    if (value === null || value === undefined || value === '') return '';
    const option = findOption(config, fieldKey, value);
    return option?.label || String(value);
  }

  function optionLabels(config, fieldKey, values) {
    return (Array.isArray(values) ? values : []).map(value => optionLabel(config, fieldKey, value)).filter(Boolean);
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  window.DEFAULT_SURVEY_CONFIG = DEFAULT_SURVEY_CONFIG;
  window.SurveyConfigUtils = {
    deepClone,
    mergeDeep,
    getPath,
    setPath,
    slugify,
    getOptions,
    findOption,
    optionLabel,
    optionLabels,
    normalize
  };
})();
