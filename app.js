const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
];

const PROBLEMS = [
  ['Falta de datos confiables para decidir', 'No hay evidencia clara para priorizar acciones.'],
  ['Baja coordinación público-privada', 'Cuesta alinear actores, cámaras, prestadores y gobierno.'],
  ['Promoción con baja conversión en demanda', 'Se comunica, pero no se traduce en visitantes o ventas.'],
  ['Estacionalidad / baja ocupación fuera de temporada', 'Demanda concentrada y meses débiles.'],
  ['Falta de presupuesto o financiamiento', 'Hay ideas, pero no fondos o proyectos armados.'],
  ['Escasa medición de impacto económico', 'No se puede demostrar retorno o resultados.'],
  ['Oferta turística poco empaquetada o comercializable', 'Experiencias dispersas, difíciles de vender.'],
  ['Débil presencia digital del destino', 'Web, redes, SEO, datos o contenidos insuficientes.'],
  ['Falta de capacitación en equipos o prestadores', 'Brechas de gestión, atención, comercialización o calidad.'],
  ['Dificultad para captar eventos o inversiones', 'Falta pipeline, propuesta o estrategia comercial.'],
  ['Gobernanza y consensos frágiles', 'La agenda depende demasiado del cambio político.'],
  ['Otro', 'Algo relevante que no aparece en la lista.']
];

const JTBD = [
  ['Justificar prioridades ante decisores', 'Necesito evidencia para defender decisiones.'],
  ['Ordenar información dispersa', 'Necesito convertir datos sueltos en lectura ejecutiva.'],
  ['Conseguir consenso con privados', 'Necesito alinear intereses y compromisos.'],
  ['Mostrar resultados de gestión', 'Necesito reportes claros y defendibles.'],
  ['Convertir diagnóstico en plan operativo', 'Necesito pasar de ideas a ejecución.'],
  ['Priorizar inversiones y proyectos', 'Necesito elegir dónde poner recursos escasos.'],
  ['Reducir dependencia de intuición política', 'Necesito decisiones más técnicas y menos reactivas.'],
  ['Profesionalizar promoción y comercialización', 'Necesito mejorar la captura de demanda.']
];

const SERVICES = [
  ['Diagnóstico estratégico del destino', 'Mapa de problemas, brechas y oportunidades.'],
  ['Observatorio / tablero de inteligencia turística', 'Datos, indicadores y reportes automáticos.'],
  ['Diseño de productos y experiencias', 'Oferta vendible, segmentada y empaquetada.'],
  ['Plan de marketing y captación de demanda', 'Estrategia, contenidos, canales y medición.'],
  ['Facilitación de mesas público-privadas', 'Consensos, agenda común y gobernanza.'],
  ['Formulación de proyectos y financiamiento', 'Carpetas, programas, fondos y priorización.'],
  ['Capacitación a equipos y prestadores', 'Gestión, calidad, atención y comercialización.'],
  ['Sistema de reportes ejecutivos automáticos', 'Informes periódicos listos para decisión política.'],
  ['Medición de impacto / ROI turístico', 'Evidencia de resultados económicos y sociales.'],
  ['Auditoría digital del destino', 'Web, redes, buscadores, reputación y funnel.'],
  ['Otro', 'Un servicio no listado.']
];

let supabaseClient = null;

function isConfigured() {
  return window.APP_CONFIG
    && window.APP_CONFIG.supabaseUrl
    && window.APP_CONFIG.supabaseAnonKey
    && !window.APP_CONFIG.supabaseUrl.includes('TU-PROYECTO')
    && !window.APP_CONFIG.supabaseAnonKey.includes('TU_ANON');
}

function initSupabase() {
  if (!isConfigured()) {
    document.getElementById('configAlert')?.classList.remove('d-none');
    return null;
  }
  return window.supabase.createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabaseAnonKey);
}

function renderOptions(containerId, name, items, max = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map(([label, help], index) => {
    const id = `${name}_${index}`;
    return `
      <label class="option-tile" for="${id}">
        <input class="form-check-input" type="checkbox" name="${name}" id="${id}" value="${escapeHtml(label)}" data-max="${max || ''}">
        <div>
          <span>${escapeHtml(label)}</span>
          <small>${escapeHtml(help)}</small>
        </div>
      </label>
    `;
  }).join('');

  if (max) {
    container.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.addEventListener('change', () => enforceMax(name, max));
    });
  }
}

function enforceMax(name, max) {
  const selected = [...document.querySelectorAll(`input[name="${name}"]:checked`)];
  const all = [...document.querySelectorAll(`input[name="${name}"]`)];
  if (selected.length > max) {
    selected[selected.length - 1].checked = false;
    showToast(`Seleccioná hasta ${max} opciones.`, 'warning');
  }
  const nowSelected = [...document.querySelectorAll(`input[name="${name}"]:checked`)];
  all.forEach(input => {
    input.disabled = nowSelected.length >= max && !input.checked;
  });
  toggleOtherFields();
}

function populateProvinces() {
  const select = document.getElementById('provinceSelect');
  if (!select) return;
  PROVINCES.forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    select.appendChild(option);
  });
}

function toggleOtherFields() {
  const otherProblem = [...document.querySelectorAll('input[name="top_problems"]')].find(x => x.value === 'Otro');
  document.getElementById('otherProblemWrap')?.classList.toggle('d-none', !otherProblem?.checked);

  const otherService = [...document.querySelectorAll('input[name="desired_services"]')].find(x => x.value === 'Otro');
  document.getElementById('otherServiceWrap')?.classList.toggle('d-none', !otherService?.checked);
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function getString(formData, key) {
  return (formData.get(key) || '').toString().trim();
}

function buildPayload(form) {
  const data = new FormData(form);
  const topProblems = getCheckedValues('top_problems');
  const desiredServices = getCheckedValues('desired_services');
  const jobs = getCheckedValues('jobs_to_be_done');

  return {
    respondent_name: getString(data, 'respondent_name') || null,
    email: getString(data, 'email') || null,
    phone: getString(data, 'phone') || null,
    contact_ok: data.get('contact_ok') === 'on',
    organization: getString(data, 'organization') || null,
    role_title: getString(data, 'role_title'),
    government_level: getString(data, 'government_level'),
    jurisdiction_name: getString(data, 'jurisdiction_name'),
    province: getString(data, 'province') || null,
    destination_type: getString(data, 'destination_type'),
    decision_role: getString(data, 'decision_role'),
    top_problems: topProblems,
    top_problem_other: getString(data, 'top_problem_other') || null,
    hair_on_fire: getString(data, 'hair_on_fire'),
    current_workaround: getString(data, 'current_workaround') || null,
    jobs_to_be_done: jobs,
    success_metric: getString(data, 'success_metric') || null,
    urgency: Number(data.get('urgency')),
    impact: Number(data.get('impact')),
    willingness_to_pay: getString(data, 'willingness_to_pay'),
    budget_range: getString(data, 'budget_range') || null,
    buying_timeline: getString(data, 'buying_timeline'),
    desired_services: desiredServices,
    desired_service_other: getString(data, 'desired_service_other') || null,
    evidence_notes: getString(data, 'evidence_notes') || null,
    metadata: {
      user_agent: navigator.userAgent,
      language: navigator.language,
      submitted_from: location.href
    }
  };
}

function validateCustom(form) {
  form.classList.add('was-validated');
  const browserOk = form.checkValidity();

  const topProblems = getCheckedValues('top_problems');
  const problemOk = topProblems.length >= 1 && topProblems.length <= 4;
  document.getElementById('problemError')?.classList.toggle('d-none', problemOk);

  const desiredServices = getCheckedValues('desired_services');
  const serviceOk = desiredServices.length <= 4;

  return browserOk && problemOk && serviceOk;
}

function setSubmitting(isSubmitting) {
  const button = document.getElementById('submitBtn');
  if (!button) return;
  button.disabled = isSubmitting;
  button.querySelector('.btn-text')?.classList.toggle('d-none', isSubmitting);
  button.querySelector('.spinner-border')?.classList.toggle('d-none', !isSubmitting);
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;

  if (!validateCustom(form)) {
    showToast('Revisá los campos obligatorios marcados.', 'warning');
    return;
  }
  if (!supabaseClient) {
    showToast('Falta configurar Supabase en config.js.', 'danger');
    return;
  }

  setSubmitting(true);
  try {
    const payload = buildPayload(form);
    const { error } = await supabaseClient
      .from('tourism_market_responses')
      .insert(payload);

    if (error) throw error;

    form.reset();
    form.classList.remove('was-validated');
    document.querySelectorAll('input[type="checkbox"]').forEach(input => input.disabled = false);
    toggleOtherFields();
    document.getElementById('problemError')?.classList.add('d-none');
    showToast('Respuesta registrada. Gracias por aportar información útil para priorizar soluciones.', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error(error);
    showToast(`No se pudo guardar la respuesta: ${error.message || 'error desconocido'}`, 'danger');
  } finally {
    setSubmitting(false);
  }
}

function showToast(message, type = 'default') {
  const toastElement = document.getElementById('appToast');
  const body = document.getElementById('toastBody');
  if (!toastElement || !body) return;

  body.textContent = message;
  toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
  if (type === 'success') toastElement.classList.add('text-bg-success');
  if (type === 'danger') toastElement.classList.add('text-bg-danger');
  if (type === 'warning') toastElement.classList.add('text-bg-warning');

  const toast = bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 4200 });
  toast.show();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  populateProvinces();
  renderOptions('problemOptions', 'top_problems', PROBLEMS, 4);
  renderOptions('jtbdOptions', 'jobs_to_be_done', JTBD, null);
  renderOptions('serviceOptions', 'desired_services', SERVICES, 4);
  supabaseClient = initSupabase();
  document.getElementById('surveyForm')?.addEventListener('submit', handleSubmit);
  document.addEventListener('change', event => {
    if (event.target.matches('input[name="top_problems"], input[name="desired_services"]')) toggleOtherFields();
  });
});
