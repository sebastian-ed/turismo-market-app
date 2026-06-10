let supabaseClient = null;
let surveyConfig = window.SurveyConfigUtils.mergeDeep(window.DEFAULT_SURVEY_CONFIG, {});

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

async function loadSurveyConfig() {
  if (!supabaseClient) return surveyConfig;
  try {
    const { data, error } = await supabaseClient
      .from('tourism_survey_config')
      .select('content')
      .eq('id', 'default')
      .maybeSingle();

    if (error) throw error;
    if (data?.content) {
      surveyConfig = window.SurveyConfigUtils.mergeDeep(window.DEFAULT_SURVEY_CONFIG, data.content);
    }
  } catch (error) {
    console.warn('No se pudo cargar la configuración editable. Se usa contenido base.', error);
  }
  return surveyConfig;
}

function applySurveyContent() {
  const cfg = surveyConfig;
  document.title = cfg.page.documentTitle || cfg.page.appName || 'Encuesta';
  setAttr('metaDescription', 'content', cfg.page.metaDescription);
  setText('navBrand', cfg.page.appName);
  setText('navAdminLink', cfg.page.navAdminLabel);
  setText('heroEyebrow', cfg.page.eyebrow);
  setText('heroTitle', cfg.page.heroTitle);
  setText('heroLead', cfg.page.heroLead);
  setText('briefTitle', cfg.page.briefTitle);
  setText('briefText', cfg.page.briefText);
  setText('briefFootnote', cfg.page.briefFootnote);
  setText('footerLeft', cfg.page.footerLeft);
  setText('footerRight', cfg.page.footerRight);
  setText('submitTitle', cfg.page.submitTitle);
  setText('submitHelp', cfg.page.submitHelp);
  setText('submitBtnText', cfg.page.submitButton);

  const badges = Array.isArray(cfg.page.badges) ? cfg.page.badges : [];
  const badgeWrap = document.getElementById('heroBadges');
  if (badgeWrap) {
    badgeWrap.innerHTML = badges.map(badge => `<span class="badge badge-soft">${escapeHtml(badge)}</span>`).join('');
  }

  (cfg.sections || []).forEach(section => {
    const heading = document.querySelector(`[data-section-id="${cssEscape(section.id)}"]`);
    if (!heading) return;
    heading.querySelector('span').textContent = section.number || '';
    heading.querySelector('h2').textContent = section.title || '';
    heading.querySelector('p').textContent = section.description || '';
  });

  applyFieldLabels();
  populateSelect('provinceSelect', surveyConfig.fields.province_options?.options || [], surveyConfig.fields.province?.firstOption || 'Seleccionar...');
  ['government_level', 'destination_type', 'decision_role', 'willingness_to_pay', 'budget_range', 'buying_timeline'].forEach(fieldKey => {
    populateSelectByName(fieldKey, fieldKey);
  });

  renderOptions('problemOptions', 'top_problems', getActiveOptions('top_problems'), surveyConfig.fields.top_problems?.max || 4);
  renderOptions('jtbdOptions', 'jobs_to_be_done', getActiveOptions('jobs_to_be_done'), null);
  renderOptions('serviceOptions', 'desired_services', getActiveOptions('desired_services'), surveyConfig.fields.desired_services?.max || 4);
  toggleOtherFields();
}

function applyFieldLabels() {
  document.querySelectorAll('[data-label-for]').forEach(label => {
    const fieldKey = label.getAttribute('data-label-for');
    const field = surveyConfig.fields[fieldKey] || {};
    const input = document.querySelector(`[name="${cssEscape(fieldKey)}"]`);
    const required = input?.hasAttribute('required');
    label.innerHTML = `${escapeHtml(field.label || label.textContent)}${required ? ' <span class="required">*</span>' : ''}`;
  });

  Object.entries(surveyConfig.fields || {}).forEach(([fieldKey, field]) => {
    if (field.placeholder !== undefined) {
      document.querySelectorAll(`[name="${cssEscape(fieldKey)}"]`).forEach(input => input.setAttribute('placeholder', field.placeholder || ''));
    }
  });

  const problems = surveyConfig.fields.top_problems || {};
  const services = surveyConfig.fields.desired_services || {};
  const jtbd = surveyConfig.fields.jobs_to_be_done || {};
  const urgency = surveyConfig.fields.urgency || {};
  const impact = surveyConfig.fields.impact || {};

  setHtml('topProblemsLabel', `${escapeHtml(problems.label || '')} <span class="required">*</span>`);
  setText('topProblemsHelp', problems.helpText || '');
  setText('problemError', problems.errorText || 'Seleccioná entre 1 y 4 problemas.');
  setText('otherProblemLabel', problems.otherLabel || 'Otro problema relevante');
  setAttrForName('top_problem_other', 'placeholder', problems.otherPlaceholder || '');

  setText('jtbdLabel', jtbd.label || '');
  setHtml('urgencyLabel', `${escapeHtml(urgency.label || '')} <span class="required">*</span>`);
  setText('urgencyLeftHelp', urgency.leftHelp || '');
  setText('urgencyRightHelp', urgency.rightHelp || '');
  setHtml('impactLabel', `${escapeHtml(impact.label || '')} <span class="required">*</span>`);
  setText('impactLeftHelp', impact.leftHelp || '');
  setText('impactRightHelp', impact.rightHelp || '');

  setText('desiredServicesLabel', services.label || '');
  setText('desiredServicesHelp', services.helpText || '');
  setText('otherServiceLabel', services.otherLabel || 'Otro servicio potencial');
  setAttrForName('desired_service_other', 'placeholder', services.otherPlaceholder || '');
  setText('contactOkLabel', surveyConfig.fields.contact_ok?.label || '');
}

function populateSelectByName(name, fieldKey) {
  const select = document.querySelector(`select[name="${cssEscape(name)}"]`);
  const field = surveyConfig.fields[fieldKey] || {};
  if (!select) return;
  populateSelectElement(select, field.options || [], field.firstOption || 'Seleccionar...');
}

function populateSelect(id, options, firstOption) {
  const select = document.getElementById(id);
  if (!select) return;
  populateSelectElement(select, options, firstOption);
}

function populateSelectElement(select, options, firstOption) {
  const current = select.value;
  select.innerHTML = `<option value="">${escapeHtml(firstOption || 'Seleccionar...')}</option>`;
  (options || []).filter(option => option.active !== false).forEach(option => {
    const el = document.createElement('option');
    el.value = option.id;
    el.textContent = option.label;
    select.appendChild(el);
  });
  if ([...select.options].some(option => option.value === current)) select.value = current;
}

function getActiveOptions(fieldKey) {
  return window.SurveyConfigUtils.getOptions(surveyConfig, fieldKey, true);
}

function renderOptions(containerId, name, items, max = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map((option, index) => {
    const id = `${name}_${index}`;
    return `
      <label class="option-tile" for="${id}">
        <input class="form-check-input" type="checkbox" name="${escapeAttr(name)}" id="${id}" value="${escapeAttr(option.id)}" data-max="${max || ''}">
        <div>
          <span>${escapeHtml(option.label)}</span>
          <small>${escapeHtml(option.help || '')}</small>
        </div>
      </label>
    `;
  }).join('');

  if (max) {
    container.querySelectorAll(`input[name="${cssEscape(name)}"]`).forEach(input => {
      input.addEventListener('change', () => enforceMax(name, max));
    });
  }
}

function enforceMax(name, max) {
  const selected = [...document.querySelectorAll(`input[name="${cssEscape(name)}"]:checked`)];
  const all = [...document.querySelectorAll(`input[name="${cssEscape(name)}"]`)];
  if (selected.length > max) {
    selected[selected.length - 1].checked = false;
    showToast(`Seleccioná hasta ${max} opciones.`, 'warning');
  }
  const nowSelected = [...document.querySelectorAll(`input[name="${cssEscape(name)}"]:checked`)];
  all.forEach(input => {
    input.disabled = nowSelected.length >= max && !input.checked;
  });
  toggleOtherFields();
}

function optionIdForLabel(fieldKey, legacyLabel) {
  const option = window.SurveyConfigUtils.findOption(surveyConfig, fieldKey, legacyLabel);
  return option?.id || legacyLabel;
}

function toggleOtherFields() {
  const otherProblemId = optionIdForLabel('top_problems', 'Otro');
  const otherProblem = [...document.querySelectorAll('input[name="top_problems"]')].find(x => x.value === otherProblemId || window.SurveyConfigUtils.optionLabel(surveyConfig, 'top_problems', x.value).toLowerCase() === 'otro');
  document.getElementById('otherProblemWrap')?.classList.toggle('d-none', !otherProblem?.checked);

  const otherServiceId = optionIdForLabel('desired_services', 'Otro');
  const otherService = [...document.querySelectorAll('input[name="desired_services"]')].find(x => x.value === otherServiceId || window.SurveyConfigUtils.optionLabel(surveyConfig, 'desired_services', x.value).toLowerCase() === 'otro');
  document.getElementById('otherServiceWrap')?.classList.toggle('d-none', !otherService?.checked);
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${cssEscape(name)}"]:checked`)].map(input => input.value);
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
      config_version: surveyConfig.version || 1,
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
  const problemOk = topProblems.length >= 1 && topProblems.length <= (surveyConfig.fields.top_problems?.max || 4);
  document.getElementById('problemError')?.classList.toggle('d-none', problemOk);

  const desiredServices = getCheckedValues('desired_services');
  const serviceOk = desiredServices.length <= (surveyConfig.fields.desired_services?.max || 4);

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
    showToast(surveyConfig.page.successMessage || 'Respuesta registrada.', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error(error);
    showToast(`No se pudo guardar la respuesta: ${error.message || 'error desconocido'}`, 'danger');
  } finally {
    setSubmitting(false);
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? '';
}

function setHtml(id, value) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = value ?? '';
}

function setAttr(id, attr, value) {
  const element = document.getElementById(id);
  if (element) element.setAttribute(attr, value ?? '');
}

function setAttrForName(name, attr, value) {
  document.querySelectorAll(`[name="${cssEscape(name)}"]`).forEach(element => element.setAttribute(attr, value ?? ''));
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
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function cssEscape(value) {
  return window.CSS?.escape ? window.CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

document.addEventListener('DOMContentLoaded', async () => {
  supabaseClient = initSupabase();
  await loadSurveyConfig();
  applySurveyContent();
  document.getElementById('surveyForm')?.addEventListener('submit', handleSubmit);
  document.addEventListener('change', event => {
    if (event.target.matches('input[name="top_problems"], input[name="desired_services"]')) toggleOtherFields();
  });
});
