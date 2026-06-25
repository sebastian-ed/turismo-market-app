let supabaseClient = null;
let allRows = [];
let filteredRows = [];
let charts = {};
let surveyConfig = window.SurveyConfigUtils.mergeDeep(window.DEFAULT_SURVEY_CONFIG, {});
let selectedResponseIds = new Set();
let pendingDeletion = null;

const DELETE_CONFIRMATION_PHRASE = 'ELIMINAR DEFINITIVAMENTE';

const CHART_PALETTE = ['#2f4a60', '#516b7f', '#7a8791', '#9aa3aa', '#b8bec4', '#6f5f4c', '#8a6418', '#5f6f52'];

const STOPWORDS = new Set([
  'para','como','pero','porque','sobre','entre','desde','hasta','donde','cuando','este','esta','esto','estas','estos','tiene','tener','tenemos','necesitamos','necesito','hace','hacer','mas','más','muy','con','sin','los','las','una','uno','unos','unas','del','que','por','son','ser','ese','esa','eso','hay','hoy','nos','les','sus','mis','tus','todo','toda','todos','todas','cada','algo','bien','mal','tambien','también','solo','sólo','otro','otra','otros','otras','turismo','turistica','turístico','turísticas','turisticos','destino','destinos','gestion','gestión'
]);

const PAGE_EDITOR_FIELDS = [
  ['page.appName', 'Nombre de la app'],
  ['page.documentTitle', 'Título del navegador'],
  ['page.metaDescription', 'Meta descripción', 'textarea'],
  ['page.navAdminLabel', 'Texto botón admin'],
  ['page.eyebrow', 'Eyebrow / bajada superior'],
  ['page.heroTitle', 'Título principal', 'textarea'],
  ['page.heroLead', 'Descripción principal', 'textarea'],
  ['page.badges', 'Badges de cabecera — uno por línea', 'textarea-array'],
  ['page.briefTitle', 'Título tarjeta lateral'],
  ['page.briefText', 'Texto tarjeta lateral', 'textarea'],
  ['page.briefFootnote', 'Nota tarjeta lateral', 'textarea'],
  ['page.submitTitle', 'Título bloque envío'],
  ['page.submitHelp', 'Ayuda bloque envío', 'textarea'],
  ['page.submitButton', 'Texto botón envío'],
  ['page.successMessage', 'Mensaje al registrar respuesta', 'textarea'],
  ['page.footerLeft', 'Footer izquierdo'],
  ['page.footerRight', 'Footer derecho']
];

const FIELD_EDITOR_FIELDS = [
  ['fields.jurisdiction_name.label', 'Label: jurisdicción'],
  ['fields.jurisdiction_name.placeholder', 'Placeholder: jurisdicción'],
  ['fields.province.label', 'Label: provincia'],
  ['fields.province.firstOption', 'Primera opción: provincia'],
  ['fields.government_level.label', 'Label: nivel de gobierno'],
  ['fields.government_level.firstOption', 'Primera opción: nivel'],
  ['fields.destination_type.label', 'Label: tipo de destino'],
  ['fields.destination_type.firstOption', 'Primera opción: tipo de destino'],
  ['fields.decision_role.label', 'Label: rol de decisión'],
  ['fields.decision_role.firstOption', 'Primera opción: rol'],
  ['fields.role_title.label', 'Label: cargo'],
  ['fields.role_title.placeholder', 'Placeholder: cargo'],
  ['fields.organization.label', 'Label: organismo'],
  ['fields.organization.placeholder', 'Placeholder: organismo'],
  ['fields.top_problems.label', 'Pregunta: problemas prioritarios', 'textarea'],
  ['fields.top_problems.helpText', 'Ayuda: problemas prioritarios'],
  ['fields.top_problems.errorText', 'Error: problemas prioritarios'],
  ['fields.top_problems.otherLabel', 'Label: otro problema'],
  ['fields.top_problems.otherPlaceholder', 'Placeholder: otro problema'],
  ['fields.hair_on_fire.label', 'Pregunta: hair-on-fire', 'textarea'],
  ['fields.hair_on_fire.placeholder', 'Placeholder: hair-on-fire', 'textarea'],
  ['fields.current_workaround.label', 'Pregunta: workaround'],
  ['fields.current_workaround.placeholder', 'Placeholder: workaround', 'textarea'],
  ['fields.success_metric.label', 'Pregunta: resultado esperado'],
  ['fields.success_metric.placeholder', 'Placeholder: resultado esperado', 'textarea'],
  ['fields.jobs_to_be_done.label', 'Pregunta: JTBD', 'textarea'],
  ['fields.urgency.label', 'Label: urgencia'],
  ['fields.urgency.leftHelp', 'Ayuda izquierda: urgencia'],
  ['fields.urgency.rightHelp', 'Ayuda derecha: urgencia'],
  ['fields.impact.label', 'Label: impacto'],
  ['fields.impact.leftHelp', 'Ayuda izquierda: impacto'],
  ['fields.impact.rightHelp', 'Ayuda derecha: impacto'],
  ['fields.willingness_to_pay.label', 'Label: disposición a pagar'],
  ['fields.willingness_to_pay.firstOption', 'Primera opción: disposición a pagar'],
  ['fields.budget_range.label', 'Label: presupuesto'],
  ['fields.budget_range.firstOption', 'Primera opción: presupuesto'],
  ['fields.buying_timeline.label', 'Label: plazo de contratación'],
  ['fields.buying_timeline.firstOption', 'Primera opción: plazo'],
  ['fields.desired_services.label', 'Pregunta: servicios útiles', 'textarea'],
  ['fields.desired_services.helpText', 'Ayuda: servicios útiles'],
  ['fields.desired_services.otherLabel', 'Label: otro servicio'],
  ['fields.desired_services.otherPlaceholder', 'Placeholder: otro servicio'],
  ['fields.evidence_notes.label', 'Label: contexto adicional'],
  ['fields.evidence_notes.placeholder', 'Placeholder: contexto adicional', 'textarea'],
  ['fields.respondent_name.label', 'Label: nombre'],
  ['fields.respondent_name.placeholder', 'Placeholder: nombre'],
  ['fields.email.label', 'Label: email'],
  ['fields.email.placeholder', 'Placeholder: email'],
  ['fields.phone.label', 'Label: teléfono'],
  ['fields.phone.placeholder', 'Placeholder: teléfono'],
  ['fields.contact_ok.label', 'Texto checkbox contacto', 'textarea']
];

const OPTION_GROUPS = [
  { fieldKey: 'government_level', title: 'Opciones · Nivel de gobierno', help: false },
  { fieldKey: 'destination_type', title: 'Opciones · Tipo de destino', help: false },
  { fieldKey: 'decision_role', title: 'Opciones · Rol de decisión', help: false },
  { fieldKey: 'top_problems', title: 'Opciones · Problemas prioritarios', help: true },
  { fieldKey: 'jobs_to_be_done', title: 'Opciones · JTBD', help: true },
  { fieldKey: 'willingness_to_pay', title: 'Opciones · Disposición a pagar', help: false },
  { fieldKey: 'budget_range', title: 'Opciones · Presupuesto', help: false },
  { fieldKey: 'buying_timeline', title: 'Opciones · Plazo de contratación', help: false },
  { fieldKey: 'desired_services', title: 'Opciones · Servicios potenciales', help: true },
  { fieldKey: 'province_options', title: 'Opciones · Provincias', help: false }
];

function isConfigured() {
  return window.APP_CONFIG
    && window.APP_CONFIG.supabaseUrl
    && window.APP_CONFIG.supabaseAnonKey
    && !window.APP_CONFIG.supabaseUrl.includes('TU-PROYECTO')
    && !window.APP_CONFIG.supabaseAnonKey.includes('TU_ANON');
}

function initSupabase() {
  if (!isConfigured()) {
    document.getElementById('loginConfigAlert')?.classList.remove('d-none');
    return null;
  }
  return window.supabase.createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabaseAnonKey);
}

async function checkSession() {
  if (!supabaseClient) return;
  await loadSurveyConfig();
  applyAdminContent();
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard(data.session.user.email);
    renderContentEditor();
    await loadRows();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginSection')?.classList.remove('d-none');
  document.getElementById('dashboardSection')?.classList.add('d-none');
  ['logoutBtn', 'refreshBtn', 'pdfBtn', 'exportBtn'].forEach(id => document.getElementById(id)?.classList.add('d-none'));
}

function showDashboard(email) {
  document.getElementById('loginSection')?.classList.add('d-none');
  document.getElementById('dashboardSection')?.classList.remove('d-none');
  ['logoutBtn', 'refreshBtn', 'pdfBtn', 'exportBtn'].forEach(id => document.getElementById(id)?.classList.remove('d-none'));
  const userEmail = document.getElementById('userEmail');
  if (userEmail) {
    userEmail.textContent = email || '';
    userEmail.classList.toggle('d-none', !email);
  }
}

function applyAdminContent() {
  document.title = surveyConfig.admin?.title || `Panel admin · ${surveyConfig.page?.appName || 'Encuesta'}`;
  setText('adminBrand', surveyConfig.page?.appName || 'Encuesta');
  setText('adminSubtitle', surveyConfig.admin?.subtitle || 'Panel admin');
  setText('loginEyebrow', surveyConfig.admin?.loginEyebrow || 'Acceso privado');
  setText('loginTitle', surveyConfig.admin?.loginTitle || 'Ingresar al panel admin');
  setText('loginText', surveyConfig.admin?.loginText || '');
  setText('loginHelp', surveyConfig.admin?.loginHelp || '');
}

async function loadSurveyConfig() {
  surveyConfig = window.SurveyConfigUtils.mergeDeep(window.DEFAULT_SURVEY_CONFIG, {});
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
    console.warn(error);
    showToast('No se pudo cargar la configuración editable. Revisá si ejecutaste el SQL nuevo.', 'warning');
  }
  return surveyConfig;
}

async function handleLogin(event) {
  event.preventDefault();
  if (!supabaseClient) {
    showToast('Falta configurar Supabase en config.js.', 'danger');
    return;
  }
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  const button = document.getElementById('loginBtn');
  button.disabled = true;
  button.textContent = 'Ingresando...';
  const formData = new FormData(form);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: String(formData.get('email')).trim(),
      password: String(formData.get('password'))
    });
    if (error) throw error;
    await loadSurveyConfig();
    applyAdminContent();
    showDashboard(data.user.email);
    renderContentEditor();
    await loadRows();
  } catch (error) {
    showToast(`No se pudo ingresar: ${error.message}`, 'danger');
  } finally {
    button.disabled = false;
    button.textContent = 'Ingresar';
  }
}

async function logout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  allRows = [];
  filteredRows = [];
  selectedResponseIds.clear();
  showLogin();
}

async function loadRows() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('tourism_market_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) throw error;
    allRows = data || [];
    selectedResponseIds.clear();
    hydrateFilters();
    applyFilters();
    showToast('Datos actualizados.', 'success');
  } catch (error) {
    console.error(error);
    showToast(`No se pudieron cargar los datos: ${error.message}`, 'danger');
  }
}

function hydrateFilters() {
  fillSelectEntries('filterLevel', uniqueEntries(allRows.map(r => r.government_level).filter(Boolean), 'government_level'), 'Todos');
  fillSelectEntries('filterProvince', uniqueEntries(allRows.map(r => r.province).filter(Boolean), 'province_options'), 'Todas');
  const problemLabels = unique(allRows.flatMap(r => optionLabels('top_problems', r.top_problems || [])).filter(Boolean)).sort((a,b) => a.localeCompare(b));
  const entries = problemLabels.map(label => ({ value: label, label }));
  fillSelectEntries('filterProblem', entries, 'Todos');
}

function fillSelectEntries(id, entries, firstLabel) {
  const select = document.getElementById(id);
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${escapeHtml(firstLabel)}</option>` + entries.map(entry => `<option value="${escapeAttr(entry.value)}">${escapeHtml(entry.label)}</option>`).join('');
  if ([...select.options].some(option => option.value === current)) select.value = current;
}

function uniqueEntries(values, fieldKey) {
  const byLabel = new Map();
  values.forEach(value => {
    const label = optionLabel(fieldKey, value) || value;
    if (!byLabel.has(label)) byLabel.set(label, { value, label });
  });
  return [...byLabel.values()].sort((a,b) => a.label.localeCompare(b.label));
}

function applyFilters() {
  const level = document.getElementById('filterLevel')?.value || '';
  const province = document.getElementById('filterProvince')?.value || '';
  const problem = document.getElementById('filterProblem')?.value || '';
  const search = normalize(document.getElementById('filterSearch')?.value || '');

  filteredRows = allRows.filter(row => {
    const levelOk = !level || row.government_level === level;
    const provinceOk = !province || row.province === province;
    const problemOk = !problem || optionLabels('top_problems', row.top_problems || []).includes(problem);
    const text = normalize([
      row.jurisdiction_name,
      optionLabel('province_options', row.province),
      row.role_title,
      row.organization,
      row.hair_on_fire,
      row.current_workaround,
      row.success_metric,
      row.evidence_notes,
      row.top_problem_other,
      row.desired_service_other,
      optionLabel('government_level', row.government_level),
      optionLabel('destination_type', row.destination_type),
      optionLabel('decision_role', row.decision_role),
      optionLabel('willingness_to_pay', row.willingness_to_pay),
      optionLabel('budget_range', row.budget_range),
      optionLabel('buying_timeline', row.buying_timeline),
      ...optionLabels('top_problems', row.top_problems || []),
      ...optionLabels('desired_services', row.desired_services || []),
      ...optionLabels('jobs_to_be_done', row.jobs_to_be_done || [])
    ].join(' '));
    const searchOk = !search || text.includes(search);
    return levelOk && provinceOk && problemOk && searchOk;
  });

  renderDashboard();
}

function renderDashboard() {
  const hasRows = allRows.length > 0;
  document.getElementById('emptyState')?.classList.toggle('d-none', hasRows);
  document.getElementById('dashboardContent')?.classList.remove('d-none');

  renderMetrics();
  renderCharts();
  renderOpportunities();
  renderKeywords();
  renderVerbatims();
  renderTable();
}

function renderMetrics() {
  const rows = filteredRows;
  const total = rows.length;
  const jurisdictions = unique(rows.map(r => normalizeKey(r.jurisdiction_name)).filter(Boolean)).length;
  const urgencyAvg = avg(rows.map(r => Number(r.urgency)).filter(Boolean));
  const payIntent = total ? Math.round(rows.filter(isPositivePayIntent).length / total * 100) : 0;

  setText('metricTotal', total);
  setText('metricJurisdictions', jurisdictions);
  setText('metricUrgency', urgencyAvg.toFixed(1));
  setText('metricPayIntent', `${payIntent}%`);
  setText('visibleCount', `${total} de ${allRows.length} respuestas visibles`);
}

function renderCharts() {
  const problemCounts = topN(countArrayValues(filteredRows, 'top_problems'), 8);
  const serviceCounts = topN(countArrayValues(filteredRows, 'desired_services'), 8);
  const payCounts = topN(countSingleValues(filteredRows, 'willingness_to_pay'), 8);

  createBarChart('problemsChart', problemCounts.map(x => x.label), problemCounts.map(x => x.count), 'Respuestas');
  createBarChart('servicesChart', serviceCounts.map(x => x.label), serviceCounts.map(x => x.count), 'Respuestas');
  createDoughnutChart('payChart', payCounts.map(x => x.label), payCounts.map(x => x.count));
  createScatterChart('matrixChart', filteredRows.map(row => ({
    x: Number(row.urgency),
    y: Number(row.impact),
    label: row.jurisdiction_name || 'Respuesta'
  })));
}

function renderOpportunities() {
  const container = document.getElementById('opportunitiesList');
  if (!container) return;
  const byProblem = new Map();

  filteredRows.forEach(row => {
    optionLabels('top_problems', row.top_problems || []).forEach(problem => {
      if (!byProblem.has(problem)) byProblem.set(problem, []);
      byProblem.get(problem).push(row);
    });
  });

  const opportunities = [...byProblem.entries()].map(([problem, rows]) => {
    const frequency = rows.length;
    const avgUrgency = avg(rows.map(r => Number(r.urgency)).filter(Boolean));
    const avgImpact = avg(rows.map(r => Number(r.impact)).filter(Boolean));
    const payPct = rows.length ? rows.filter(isPositivePayIntent).length / rows.length : 0;
    const score = frequency * ((avgUrgency + avgImpact) / 2) * (1 + payPct);
    return { problem, rows, frequency, avgUrgency, avgImpact, payPct, score };
  }).sort((a,b) => b.score - a.score).slice(0, 6);

  if (!opportunities.length) {
    container.innerHTML = '<p class="text-secondary mb-0">No hay datos suficientes con los filtros actuales.</p>';
    return;
  }

  container.innerHTML = opportunities.map(item => `
    <div class="opportunity-item">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div class="opportunity-title">${escapeHtml(item.problem)}</div>
        <span class="opportunity-score">Score ${item.score.toFixed(1)}</span>
      </div>
      <div class="opportunity-meta mb-2">
        Frecuencia: ${item.frequency} · Urgencia: ${item.avgUrgency.toFixed(1)} · Impacto: ${item.avgImpact.toFixed(1)} · Señal de pago: ${Math.round(item.payPct * 100)}%
      </div>
      <div class="small"><strong>Servicio sugerido:</strong> ${escapeHtml(suggestService(item.problem))}</div>
    </div>
  `).join('');
}

function renderKeywords() {
  const container = document.getElementById('keywordsList');
  if (!container) return;
  const text = filteredRows.map(row => [
    row.hair_on_fire,
    row.current_workaround,
    row.success_metric,
    row.evidence_notes,
    row.top_problem_other,
    row.desired_service_other,
    ...optionLabels('top_problems', row.top_problems || []),
    ...optionLabels('desired_services', row.desired_services || [])
  ].join(' ')).join(' ');

  const counts = wordFrequency(text).slice(0, 24);
  container.innerHTML = counts.length
    ? counts.map(([word, count]) => `<span class="keyword-pill">${escapeHtml(word)} <strong>${count}</strong></span>`).join('')
    : '<span class="text-secondary small">Sin texto suficiente.</span>';
}

function renderVerbatims() {
  const container = document.getElementById('verbatimList');
  if (!container) return;
  const items = filteredRows
    .filter(row => row.hair_on_fire)
    .sort((a,b) => ((Number(b.urgency) + Number(b.impact)) - (Number(a.urgency) + Number(a.impact))))
    .slice(0, 5);

  container.innerHTML = items.length
    ? items.map(row => `<blockquote>“${escapeHtml(row.hair_on_fire)}”<br><span class="small text-secondary">${escapeHtml(row.jurisdiction_name || '')} · U${row.urgency}/I${row.impact}</span></blockquote>`).join('')
    : '<p class="small text-secondary mb-0">Sin respuestas abiertas.</p>';
}

function renderTable() {
  const tbody = document.getElementById('responsesTable');
  if (!tbody) return;
  selectedResponseIds = new Set([...selectedResponseIds].filter(id => filteredRows.some(row => row.id === id)));
  tbody.innerHTML = filteredRows.map(row => {
    const checked = selectedResponseIds.has(row.id) ? 'checked' : '';
    return `
      <tr data-response-id="${escapeAttr(row.id)}">
        <td><input class="form-check-input response-check" type="checkbox" value="${escapeAttr(row.id)}" ${checked} aria-label="Seleccionar respuesta"></td>
        <td>${formatDate(row.created_at)}</td>
        <td><strong>${escapeHtml(row.jurisdiction_name || '')}</strong><br><span class="text-secondary small">${escapeHtml(optionLabel('province_options', row.province) || '')}</span></td>
        <td>${escapeHtml(optionLabel('government_level', row.government_level))}<br><span class="text-secondary small">${escapeHtml(optionLabel('decision_role', row.decision_role))}</span></td>
        <td class="truncate-cell" title="${escapeAttr(optionLabels('top_problems', row.top_problems || []).join(', '))}">${escapeHtml(optionLabels('top_problems', row.top_problems || []).join(', '))}</td>
        <td>${row.urgency || ''}</td>
        <td>${row.impact || ''}</td>
        <td class="truncate-cell" title="${escapeAttr(optionLabel('willingness_to_pay', row.willingness_to_pay))}">${escapeHtml(optionLabel('willingness_to_pay', row.willingness_to_pay))}</td>
        <td class="truncate-cell" title="${escapeAttr(row.hair_on_fire || '')}">${escapeHtml(row.hair_on_fire || '')}</td>
        <td>${renderContact(row)}</td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-secondary" type="button" data-action="view-response" data-id="${escapeAttr(row.id)}">Ver</button>
          <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete-response" data-id="${escapeAttr(row.id)}">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
  syncSelectionControls();
}

function renderContact(row) {
  const parts = [];
  if (row.respondent_name) parts.push(`<strong>${escapeHtml(row.respondent_name)}</strong>`);
  if (row.email) parts.push(`<a href="mailto:${escapeAttr(row.email)}">${escapeHtml(row.email)}</a>`);
  if (row.phone) parts.push(`<span>${escapeHtml(row.phone)}</span>`);
  if (!parts.length) return '<span class="text-secondary small">Sin contacto</span>';
  const ok = row.contact_ok ? '<span class="badge text-bg-light border">OK contacto</span>' : '<span class="badge text-bg-light border">No autorizó</span>';
  return `${parts.join('<br>')}<br>${ok}`;
}

function showResponseDetail(id) {
  const row = allRows.find(item => item.id === id);
  if (!row) return;
  const body = document.getElementById('responseDetailBody');
  if (!body) return;
  const rows = [
    ['Fecha', formatDate(row.created_at)],
    ['Jurisdicción', row.jurisdiction_name],
    ['Provincia', optionLabel('province_options', row.province)],
    ['Nivel', optionLabel('government_level', row.government_level)],
    ['Tipo de destino', optionLabel('destination_type', row.destination_type)],
    ['Rol de decisión', optionLabel('decision_role', row.decision_role)],
    ['Cargo', row.role_title],
    ['Organismo', row.organization],
    ['Problemas', optionLabels('top_problems', row.top_problems || []).join(', ')],
    ['Otro problema', row.top_problem_other],
    ['Hair-on-fire', row.hair_on_fire],
    ['Cómo lo resuelven hoy', row.current_workaround],
    ['JTBD', optionLabels('jobs_to_be_done', row.jobs_to_be_done || []).join(', ')],
    ['Resultado esperado', row.success_metric],
    ['Urgencia', row.urgency],
    ['Impacto', row.impact],
    ['Disposición a pagar', optionLabel('willingness_to_pay', row.willingness_to_pay)],
    ['Presupuesto', optionLabel('budget_range', row.budget_range)],
    ['Plazo', optionLabel('buying_timeline', row.buying_timeline)],
    ['Servicios deseados', optionLabels('desired_services', row.desired_services || []).join(', ')],
    ['Otro servicio', row.desired_service_other],
    ['Notas', row.evidence_notes],
    ['Nombre', row.respondent_name],
    ['Email', row.email],
    ['Teléfono', row.phone],
    ['Acepta contacto', row.contact_ok ? 'Sí' : 'No']
  ];
  body.innerHTML = `
    <div class="detail-grid">
      ${rows.map(([label, value]) => `
        <div class="detail-item">
          <div class="detail-label">${escapeHtml(label)}</div>
          <div class="detail-value">${escapeHtml(value || '—')}</div>
        </div>
      `).join('')}
    </div>
  `;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('responseDetailModal')).show();
}

function deleteResponses(ids, mode = 'selected') {
  const targetIds = [...new Set(ids)].filter(Boolean);
  if (!targetIds.length) {
    showToast('No hay respuestas seleccionadas para eliminar.', 'warning');
    return;
  }

  const targetRows = allRows.filter(row => targetIds.includes(row.id));
  const destinations = unique(targetRows.map(row => row.jurisdiction_name).filter(Boolean));
  const title = targetIds.length === 1
    ? `Vas a eliminar la respuesta de ${destinations[0] || 'este destino'}.`
    : `Vas a eliminar ${targetIds.length} respuestas.`;
  const scopeLabel = mode === 'filtered'
    ? 'Corresponden a todas las respuestas visibles con los filtros actuales.'
    : mode === 'selected'
      ? 'Corresponden a las respuestas seleccionadas en la tabla.'
      : 'Esta respuesta se eliminará de forma permanente.';
  const destinationLabel = destinations.length === 1
    ? `Destino: ${destinations[0]}.`
    : destinations.length > 1
      ? `Destinos involucrados: ${destinations.slice(0, 6).join(', ')}${destinations.length > 6 ? ` y ${destinations.length - 6} más` : ''}.`
      : '';

  pendingDeletion = { ids: targetIds, mode };
  setText('deleteConfirmationTitle', title);
  setText('deleteConfirmationDetail', `${scopeLabel} ${destinationLabel} La acción no se puede deshacer.`.trim());
  setText('deleteConfirmationPhrase', DELETE_CONFIRMATION_PHRASE);

  const input = document.getElementById('deleteConfirmationInput');
  if (input) input.value = '';
  syncDeleteConfirmation();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmationModal')).show();
}

function syncDeleteConfirmation() {
  const input = document.getElementById('deleteConfirmationInput');
  const button = document.getElementById('confirmDeleteBtn');
  if (!button) return;
  button.disabled = !pendingDeletion || String(input?.value || '').trim() !== DELETE_CONFIRMATION_PHRASE;
}

async function performConfirmedDeletion() {
  const input = document.getElementById('deleteConfirmationInput');
  const button = document.getElementById('confirmDeleteBtn');
  if (!pendingDeletion || String(input?.value || '').trim() !== DELETE_CONFIRMATION_PHRASE) return;

  const targetIds = [...pendingDeletion.ids];
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Eliminando...';

  try {
    const { error } = await supabaseClient
      .from('tourism_market_responses')
      .delete()
      .in('id', targetIds);
    if (error) throw error;

    allRows = allRows.filter(row => !targetIds.includes(row.id));
    selectedResponseIds.clear();
    pendingDeletion = null;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmationModal')).hide();
    hydrateFilters();
    applyFilters();
    showToast(`Se eliminaron ${targetIds.length} respuesta(s).`, 'success');
  } catch (error) {
    console.error(error);
    showToast(`No se pudieron eliminar respuestas: ${error.message}`, 'danger');
  } finally {
    button.innerHTML = '<i class="bi bi-trash me-1"></i>Eliminar definitivamente';
    syncDeleteConfirmation();
  }
}

function syncSelectionControls() {
  const deleteSelected = document.getElementById('deleteSelectedBtn');
  if (deleteSelected) deleteSelected.disabled = selectedResponseIds.size === 0;
  const deleteFiltered = document.getElementById('deleteFilteredBtn');
  if (deleteFiltered) deleteFiltered.disabled = filteredRows.length === 0;
  const selectAll = document.getElementById('selectAllResponses');
  if (selectAll) {
    const visibleIds = filteredRows.map(row => row.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedResponseIds.has(id));
    selectAll.checked = allVisibleSelected;
    selectAll.indeterminate = selectedResponseIds.size > 0 && !allVisibleSelected;
  }
}

function createBarChart(id, labels, values, label) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label, data: values, backgroundColor: CHART_PALETTE, borderColor: '#2f4a60', borderWidth: 1 }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function createDoughnutChart(id, labels, values) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: CHART_PALETTE, borderColor: '#ffffff', borderWidth: 2 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function createScatterChart(id, points) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Respuesta',
        data: points,
        pointRadius: 6,
        pointHoverRadius: 8,
        backgroundColor: '#2f4a60',
        borderColor: '#1f2933'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.raw.label}: urgencia ${context.raw.x}, impacto ${context.raw.y}`
          }
        }
      },
      scales: {
        x: { min: 0, max: 5.5, title: { display: true, text: 'Urgencia' }, ticks: { stepSize: 1 } },
        y: { min: 0, max: 5.5, title: { display: true, text: 'Impacto' }, ticks: { stepSize: 1 } }
      }
    }
  });
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function exportCsv() {
  const rows = filteredRows;
  if (!rows.length) {
    showToast('No hay datos para exportar.', 'warning');
    return;
  }
  const headers = [
    'created_at','jurisdiction_name','province','government_level','destination_type','decision_role','role_title','organization',
    'top_problems','top_problem_other','hair_on_fire','current_workaround','jobs_to_be_done','success_metric','urgency','impact',
    'willingness_to_pay','budget_range','buying_timeline','desired_services','desired_service_other','evidence_notes',
    'respondent_name','email','phone','contact_ok'
  ];
  const csv = [headers.join(',')].concat(rows.map(row => headers.map(header => csvEscape(exportValue(row, header))).join(','))).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `radar-prioridades-turisticas-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPdfExportModal() {
  if (!filteredRows.length) {
    showToast('No hay respuestas visibles para exportar con los filtros actuales.', 'warning');
    return;
  }

  setText('pdfFilteredCount', filteredRows.length);
  setText('pdfSelectedCount', selectedResponseIds.size);

  const selectedScope = document.getElementById('pdfScopeSelected');
  if (selectedScope) {
    selectedScope.disabled = selectedResponseIds.size === 0;
    if (selectedScope.disabled && selectedScope.checked) {
      const filteredScope = document.getElementById('pdfScopeFiltered');
      if (filteredScope) filteredScope.checked = true;
    }
  }

  syncPdfExportControls();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('pdfExportModal')).show();
}

function syncPdfExportControls() {
  const includeReport = document.getElementById('pdfIncludeReport')?.checked === true;
  const includeResponses = document.getElementById('pdfIncludeResponses')?.checked === true;
  document.getElementById('pdfResponseScope')?.classList.toggle('d-none', !includeResponses);
  document.getElementById('pdfExportValidation')?.classList.toggle('d-none', includeReport || includeResponses);
  const button = document.getElementById('generatePdfBtn');
  if (button) button.disabled = !(includeReport || includeResponses);
}

async function generatePdfExport() {
  const includeReport = document.getElementById('pdfIncludeReport')?.checked === true;
  const includeResponses = document.getElementById('pdfIncludeResponses')?.checked === true;
  if (!includeReport && !includeResponses) {
    syncPdfExportControls();
    return;
  }

  if (!window.jspdf?.jsPDF) {
    showToast('No se pudo cargar el generador de PDF. Revisá la conexión a internet e intentá nuevamente.', 'danger');
    return;
  }

  const scope = document.querySelector('input[name="pdfResponseScope"]:checked')?.value || 'filtered';
  const responseRows = scope === 'selected'
    ? allRows.filter(row => selectedResponseIds.has(row.id))
    : filteredRows;

  if (includeResponses && !responseRows.length) {
    showToast('No hay respuestas individuales en el alcance elegido.', 'warning');
    return;
  }

  const button = document.getElementById('generatePdfBtn');
  const originalHtml = button?.innerHTML || '';
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Generando...';
  }

  try {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    let hasContent = false;

    if (includeReport) {
      addExecutiveReportToPdf(doc, filteredRows, hasContent);
      hasContent = true;
    }

    if (includeResponses) {
      addIndividualResponsesToPdf(doc, responseRows, hasContent);
      hasContent = true;
    }

    addPdfPageNumbers(doc);
    const baseName = buildPdfFileName(includeReport, includeResponses, includeResponses ? responseRows : filteredRows);
    doc.save(baseName);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('pdfExportModal')).hide();
    showToast('PDF generado correctamente.', 'success');
  } catch (error) {
    console.error(error);
    showToast(`No se pudo generar el PDF: ${error.message || 'error desconocido'}`, 'danger');
  } finally {
    if (button) {
      button.innerHTML = originalHtml;
      syncPdfExportControls();
    }
  }
}

function addExecutiveReportToPdf(doc, rows, addPageFirst = false) {
  if (addPageFirst) doc.addPage();
  const destinations = getDestinationNames(rows);
  const destinationTitle = getDestinationTitle(rows);
  const generatedAt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  doc.setFillColor(31, 41, 51);
  doc.rect(0, 0, 210, 48, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(pdfSafe(surveyConfig.page?.appName || 'Radar de Prioridades Turísticas'), 15, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Informe ejecutivo de resultados', 15, 30);
  doc.setFontSize(9);
  doc.text(pdfSafe(destinationTitle), 15, 39);

  doc.setTextColor(31, 41, 51);
  doc.setFontSize(9);
  doc.text(pdfSafe(`Generado: ${generatedAt}`), 15, 57);

  let tableStart = 68;
  if (destinations.length > 1) {
    doc.setFont('helvetica', 'bold');
    doc.text('Destinos incluidos:', 15, 66);
    doc.setFont('helvetica', 'normal');
    const destinationLines = doc.splitTextToSize(pdfSafe(destinations.join(', ')), 180).slice(0, 8);
    doc.text(destinationLines, 15, 72);
    tableStart = Math.min(118, 76 + destinationLines.length * 4.5);
  }

  const total = rows.length;
  const urgencyAvg = avg(rows.map(row => Number(row.urgency)).filter(Number.isFinite));
  const impactAvg = avg(rows.map(row => Number(row.impact)).filter(Number.isFinite));
  const payIntent = total ? Math.round(rows.filter(isPositivePayIntent).length / total * 100) : 0;

  const kpiTable = drawPdfTable(doc, {
    startY: tableStart,
    columns: [
      { header: 'Respuestas', width: 36, align: 'center' },
      { header: 'Destinos', width: 36, align: 'center' },
      { header: 'Urgencia prom.', width: 36, align: 'center' },
      { header: 'Impacto prom.', width: 36, align: 'center' },
      { header: 'Señal de pago', width: 36, align: 'center' }
    ],
    rows: [[String(total), String(destinations.length), urgencyAvg.toFixed(1), impactAvg.toFixed(1), `${payIntent}%`]],
    fontSize: 9,
    cellPadding: 3,
    zebra: false
  });

  const filterText = getActiveFilterSummary();
  let y = kpiTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Alcance del análisis', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const scopeLines = doc.splitTextToSize(pdfSafe(filterText), 180);
  doc.text(scopeLines, 15, y);
  y += scopeLines.length * 4.5 + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Lectura ejecutiva', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const executiveText = total
    ? `La base analizada contiene ${total} respuestas de ${destinations.length} destino(s). La urgencia promedio es ${urgencyAvg.toFixed(1)} sobre 5 y el impacto promedio es ${impactAvg.toFixed(1)} sobre 5. El ${payIntent}% muestra una señal positiva o probable de contratación. Los gráficos y prioridades siguientes se calculan exclusivamente con las respuestas visibles según los filtros activos.`
    : 'No hay respuestas visibles con los filtros actuales. El informe conserva el alcance seleccionado, pero no presenta resultados cuantitativos.';
  doc.text(doc.splitTextToSize(pdfSafe(executiveText), 180), 15, y);

  const chartSpecs = [
    ['problemsChart', 'Problemas más frecuentes'],
    ['servicesChart', 'Servicios con mayor demanda declarada'],
    ['payChart', 'Disposición a pagar'],
    ['matrixChart', 'Urgencia vs impacto']
  ];
  chartSpecs.forEach(([id, title]) => addChartPageToPdf(doc, id, title, destinationTitle));

  addOpportunitiesPageToPdf(doc, rows, destinationTitle);
  addQualitativePageToPdf(doc, rows, destinationTitle);
}

function addChartPageToPdf(doc, chartId, title, destinationTitle) {
  doc.addPage();
  addPdfSectionHeader(doc, title, destinationTitle);
  const chart = charts[chartId];
  if (!chart || !chart.canvas) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No hay gráfico disponible para el alcance actual.', 15, 45);
    return;
  }

  const image = chart.toBase64Image();
  const ratio = chart.canvas.width / Math.max(chart.canvas.height, 1);
  let width = 180;
  let height = width / ratio;
  if (height > 190) {
    height = 190;
    width = height * ratio;
  }
  const x = (210 - width) / 2;
  doc.addImage(image, 'PNG', x, 42, width, height, undefined, 'FAST');
}

function addOpportunitiesPageToPdf(doc, rows, destinationTitle) {
  doc.addPage();
  addPdfSectionHeader(doc, 'Oportunidades priorizadas', destinationTitle);
  const opportunities = calculateOpportunityItems(rows, 8);
  if (!opportunities.length) {
    doc.setFontSize(10);
    doc.text('No hay datos suficientes para priorizar oportunidades.', 15, 45);
    return;
  }

  drawPdfTable(doc, {
    startY: 39,
    columns: [
      { header: 'Problema', width: 42 },
      { header: 'Frec.', width: 13, align: 'center' },
      { header: 'Urg.', width: 13, align: 'center' },
      { header: 'Imp.', width: 13, align: 'center' },
      { header: 'Pago', width: 15, align: 'center' },
      { header: 'Score', width: 15, align: 'center' },
      { header: 'Servicio sugerido', width: 69 }
    ],
    rows: opportunities.map(item => [
      pdfSafe(item.problem),
      String(item.frequency),
      item.avgUrgency.toFixed(1),
      item.avgImpact.toFixed(1),
      `${Math.round(item.payPct * 100)}%`,
      item.score.toFixed(1),
      pdfSafe(suggestService(item.problem))
    ]),
    fontSize: 7.3,
    cellPadding: 2.3,
    zebra: true,
    onNewPage: () => addPdfSectionHeader(doc, 'Oportunidades priorizadas - continuación', destinationTitle)
  });
}

function addQualitativePageToPdf(doc, rows, destinationTitle) {
  doc.addPage();
  addPdfSectionHeader(doc, 'Hallazgos cualitativos', destinationTitle);
  const keywords = buildKeywordItems(rows, 24);
  const verbatims = rows
    .filter(row => row.hair_on_fire)
    .sort((a, b) => ((Number(b.urgency) + Number(b.impact)) - (Number(a.urgency) + Number(a.impact))))
    .slice(0, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Palabras que más aparecen', 15, 43);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const keywordText = keywords.length
    ? keywords.map(([word, count]) => `${word} (${count})`).join(' · ')
    : 'Sin texto suficiente.';
  doc.text(doc.splitTextToSize(pdfSafe(keywordText), 180), 15, 50);

  let y = 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Frases hair-on-fire', 15, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (!verbatims.length) {
    doc.text('Sin respuestas abiertas.', 15, y);
    return;
  }

  verbatims.forEach(row => {
    const quote = `“${row.hair_on_fire}”`;
    const meta = `${row.jurisdiction_name || 'Sin destino'} - Urgencia ${row.urgency || '-'} / Impacto ${row.impact || '-'}`;
    const quoteLines = doc.splitTextToSize(pdfSafe(quote), 174);
    const needed = quoteLines.length * 4.5 + 12;
    if (y + needed > 280) {
      doc.addPage();
      addPdfSectionHeader(doc, 'Hallazgos cualitativos - continuación', destinationTitle);
      y = 43;
    }
    doc.setDrawColor(47, 74, 96);
    doc.setLineWidth(0.8);
    doc.line(15, y - 2, 15, y + quoteLines.length * 4.5 + 4);
    doc.text(quoteLines, 20, y);
    y += quoteLines.length * 4.5 + 2;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfSafe(meta), 20, y);
    doc.setTextColor(31, 41, 51);
    doc.setFontSize(9);
    y += 10;
  });
}

function addIndividualResponsesToPdf(doc, rows, addPageFirst = false) {
  rows.forEach((row, index) => {
    if (addPageFirst || index > 0) doc.addPage();
    const destination = row.jurisdiction_name || 'Destino sin identificar';
    addPdfSectionHeader(doc, `Respuesta individual - ${destination}`, formatDate(row.created_at));

    const detailRows = getResponsePdfRows(row);
    drawPdfTable(doc, {
      startY: 39,
      columns: [
        { header: 'Campo', width: 48, bold: true },
        { header: 'Respuesta', width: 132 }
      ],
      rows: detailRows.map(([label, value]) => [pdfSafe(label), pdfSafe(value || '—')]),
      fontSize: 8.2,
      cellPadding: 2.6,
      zebra: false,
      firstColumnFill: [245, 247, 250],
      firstColumnBold: true,
      onNewPage: () => addPdfSectionHeader(doc, `Respuesta individual - ${destination} - continuación`, formatDate(row.created_at))
    });
  });
}

function getResponsePdfRows(row) {
  return [
    ['Fecha de respuesta', formatDate(row.created_at)],
    [fieldLabel('jurisdiction_name', 'Destino / jurisdicción'), row.jurisdiction_name],
    [fieldLabel('province', 'Provincia'), optionLabel('province_options', row.province)],
    [fieldLabel('government_level', 'Nivel de gobierno'), optionLabel('government_level', row.government_level)],
    [fieldLabel('destination_type', 'Tipo de destino'), optionLabel('destination_type', row.destination_type)],
    [fieldLabel('decision_role', 'Rol en decisiones'), optionLabel('decision_role', row.decision_role)],
    [fieldLabel('role_title', 'Cargo / función'), row.role_title],
    [fieldLabel('organization', 'Organismo / área'), row.organization],
    [fieldLabel('top_problems', 'Problemas prioritarios'), optionLabels('top_problems', row.top_problems || []).join(', ')],
    ['Otro problema', row.top_problem_other],
    [fieldLabel('hair_on_fire', 'Problema a resolver primero'), row.hair_on_fire],
    [fieldLabel('current_workaround', 'Cómo lo resuelven hoy'), row.current_workaround],
    [fieldLabel('jobs_to_be_done', 'Trabajo que necesita resolver'), optionLabels('jobs_to_be_done', row.jobs_to_be_done || []).join(', ')],
    [fieldLabel('success_metric', 'Resultado esperado'), row.success_metric],
    [fieldLabel('urgency', 'Urgencia'), row.urgency ? `${row.urgency} / 5` : ''],
    [fieldLabel('impact', 'Impacto'), row.impact ? `${row.impact} / 5` : ''],
    [fieldLabel('willingness_to_pay', 'Disposición a pagar'), optionLabel('willingness_to_pay', row.willingness_to_pay)],
    [fieldLabel('budget_range', 'Rango estimado'), optionLabel('budget_range', row.budget_range)],
    [fieldLabel('buying_timeline', 'Plazo de contratación'), optionLabel('buying_timeline', row.buying_timeline)],
    [fieldLabel('desired_services', 'Servicios deseados'), optionLabels('desired_services', row.desired_services || []).join(', ')],
    ['Otro servicio', row.desired_service_other],
    [fieldLabel('evidence_notes', 'Contexto adicional'), row.evidence_notes],
    [fieldLabel('respondent_name', 'Nombre'), row.respondent_name],
    [fieldLabel('email', 'Email'), row.email],
    [fieldLabel('phone', 'Teléfono / WhatsApp'), row.phone],
    ['Autoriza contacto', row.contact_ok ? 'Sí' : 'No']
  ];
}

function fieldLabel(fieldKey, fallback) {
  return surveyConfig.fields?.[fieldKey]?.label || fallback;
}

function drawPdfTable(doc, options) {
  const columns = options.columns || [];
  const rows = options.rows || [];
  const startX = options.startX || 15;
  const pageTop = options.pageTop || 39;
  const pageBottom = options.pageBottom || 279;
  const fontSize = options.fontSize || 8;
  const padding = options.cellPadding ?? 2.4;
  const lineHeight = fontSize * 0.43;
  let y = options.startY || pageTop;

  function wrapCell(value, width) {
    const availableWidth = Math.max(4, width - padding * 2);
    const lines = doc.splitTextToSize(pdfSafe(value ?? ''), availableWidth);
    return Array.isArray(lines) && lines.length ? lines : [''];
  }

  function drawHeader() {
    const headerLines = columns.map(column => wrapCell(column.header || '', column.width));
    const headerHeight = Math.max(...headerLines.map(lines => lines.length), 1) * lineHeight + padding * 2;
    let x = startX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(255, 255, 255);
    doc.setDrawColor(217, 222, 231);
    columns.forEach((column, index) => {
      doc.setFillColor(47, 74, 96);
      doc.rect(x, y, column.width, headerHeight, 'FD');
      const align = column.align || 'left';
      const textX = align === 'center' ? x + column.width / 2 : x + padding;
      doc.text(headerLines[index], textX, y + padding + lineHeight * 0.78, { align });
      x += column.width;
    });
    y += headerHeight;
  }

  function newPage() {
    doc.addPage();
    if (typeof options.onNewPage === 'function') options.onNewPage();
    y = pageTop;
    drawHeader();
  }

  drawHeader();

  rows.forEach((row, rowIndex) => {
    const wrapped = columns.map((column, index) => wrapCell(row[index] ?? '', column.width));
    const rowHeight = Math.max(...wrapped.map(lines => lines.length), 1) * lineHeight + padding * 2;
    if (y + rowHeight > pageBottom) newPage();

    let x = startX;
    columns.forEach((column, columnIndex) => {
      const useFirstColumnFill = columnIndex === 0 && Array.isArray(options.firstColumnFill);
      const fill = useFirstColumnFill
        ? options.firstColumnFill
        : options.zebra && rowIndex % 2 === 1
          ? [245, 247, 250]
          : [255, 255, 255];
      doc.setFillColor(...fill);
      doc.setDrawColor(217, 222, 231);
      doc.rect(x, y, column.width, rowHeight, 'FD');
      doc.setFont('helvetica', (column.bold || (columnIndex === 0 && options.firstColumnBold)) ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(31, 41, 51);
      const align = column.align || 'left';
      const textX = align === 'center' ? x + column.width / 2 : x + padding;
      doc.text(wrapped[columnIndex], textX, y + padding + lineHeight * 0.78, { align });
      x += column.width;
    });
    y += rowHeight;
  });

  return { finalY: y };
}

function addPdfSectionHeader(doc, title, subtitle = '') {
  doc.setFillColor(31, 41, 51);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  const titleLines = doc.splitTextToSize(pdfSafe(title), 180);
  doc.text(titleLines.slice(0, 2), 15, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  if (subtitle) doc.text(pdfSafe(subtitle), 15, 27);
  doc.setTextColor(31, 41, 51);
}

function addPdfPageNumbers(doc) {
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfSafe(`${surveyConfig.page?.appName || 'Radar de Prioridades Turísticas'} - Página ${page} de ${totalPages}`), 105, 291, { align: 'center' });
  }
}

function calculateOpportunityItems(rows, limit = 6) {
  const byProblem = new Map();
  rows.forEach(row => {
    optionLabels('top_problems', row.top_problems || []).forEach(problem => {
      if (!byProblem.has(problem)) byProblem.set(problem, []);
      byProblem.get(problem).push(row);
    });
  });

  return [...byProblem.entries()].map(([problem, problemRows]) => {
    const frequency = problemRows.length;
    const avgUrgency = avg(problemRows.map(row => Number(row.urgency)).filter(Number.isFinite));
    const avgImpact = avg(problemRows.map(row => Number(row.impact)).filter(Number.isFinite));
    const payPct = problemRows.length ? problemRows.filter(isPositivePayIntent).length / problemRows.length : 0;
    const score = frequency * ((avgUrgency + avgImpact) / 2) * (1 + payPct);
    return { problem, frequency, avgUrgency, avgImpact, payPct, score };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
}

function buildKeywordItems(rows, limit = 24) {
  const text = rows.map(row => [
    row.hair_on_fire,
    row.current_workaround,
    row.success_metric,
    row.evidence_notes,
    row.top_problem_other,
    row.desired_service_other,
    ...optionLabels('top_problems', row.top_problems || []),
    ...optionLabels('desired_services', row.desired_services || [])
  ].join(' ')).join(' ');
  return wordFrequency(text).slice(0, limit);
}

function getDestinationNames(rows) {
  return unique(rows.map(row => String(row.jurisdiction_name || '').trim()).filter(Boolean)).sort((a, b) => a.localeCompare(b));
}

function getDestinationTitle(rows) {
  const destinations = getDestinationNames(rows);
  if (!destinations.length) return 'Sin destinos en el alcance actual';
  if (destinations.length === 1) return `Destino: ${destinations[0]}`;
  return `Alcance: ${destinations.length} destinos`;
}

function getActiveFilterSummary() {
  const level = document.getElementById('filterLevel');
  const province = document.getElementById('filterProvince');
  const problem = document.getElementById('filterProblem');
  const search = document.getElementById('filterSearch')?.value.trim();
  const parts = [];
  if (level?.value) parts.push(`Nivel: ${level.options[level.selectedIndex]?.text || level.value}`);
  if (province?.value) parts.push(`Provincia: ${province.options[province.selectedIndex]?.text || province.value}`);
  if (problem?.value) parts.push(`Problema: ${problem.options[problem.selectedIndex]?.text || problem.value}`);
  if (search) parts.push(`Búsqueda: ${search}`);
  return parts.length ? `Filtros aplicados: ${parts.join(' | ')}.` : 'Sin filtros: se incluyen todas las respuestas disponibles.';
}

function buildPdfFileName(includeReport, includeResponses, rows) {
  const destinations = getDestinationNames(rows);
  const scope = destinations.length === 1 ? destinations[0] : destinations.length > 1 ? `${destinations.length}-destinos` : 'sin-datos';
  const content = includeReport && includeResponses ? 'informe-y-respuestas' : includeReport ? 'informe' : 'respuestas';
  return `${slugForFile(content)}-${slugForFile(scope)}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

function slugForFile(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'exportacion';
}

function pdfSafe(value) {
  return String(value ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/\u00a0/g, ' ');
}

function exportValue(row, header) {
  if (header === 'top_problems') return optionLabels('top_problems', row.top_problems || []).join(' | ');
  if (header === 'jobs_to_be_done') return optionLabels('jobs_to_be_done', row.jobs_to_be_done || []).join(' | ');
  if (header === 'desired_services') return optionLabels('desired_services', row.desired_services || []).join(' | ');
  if (header === 'government_level') return optionLabel('government_level', row.government_level);
  if (header === 'province') return optionLabel('province_options', row.province);
  if (header === 'destination_type') return optionLabel('destination_type', row.destination_type);
  if (header === 'decision_role') return optionLabel('decision_role', row.decision_role);
  if (header === 'willingness_to_pay') return optionLabel('willingness_to_pay', row.willingness_to_pay);
  if (header === 'budget_range') return optionLabel('budget_range', row.budget_range);
  if (header === 'buying_timeline') return optionLabel('buying_timeline', row.buying_timeline);
  return row[header] ?? '';
}

function renderContentEditor() {
  const container = document.getElementById('contentEditor');
  if (!container) return;
  const sectionsHtml = (surveyConfig.sections || []).map((section, index) => `
    <div class="content-subcard">
      <div class="row g-2">
        <div class="col-md-2">${editorControl(`sections.${index}.number`, 'N°')}</div>
        <div class="col-md-4">${editorControl(`sections.${index}.title`, 'Título')}</div>
        <div class="col-md-6">${editorControl(`sections.${index}.description`, 'Descripción', 'textarea')}</div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="accordion" id="contentAccordion">
      ${accordionItem('pageEditor', '1. Página, portada y envío', renderEditorFields(PAGE_EDITOR_FIELDS), true)}
      ${accordionItem('sectionsEditor', '2. Títulos y subtítulos de secciones', sectionsHtml, false)}
      ${accordionItem('fieldsEditor', '3. Preguntas, labels y placeholders', renderEditorFields(FIELD_EDITOR_FIELDS), false)}
      ${accordionItem('optionsEditor', '4. Opciones de respuestas', OPTION_GROUPS.map(renderOptionGroup).join(''), false)}
    </div>
  `;
}

function accordionItem(id, title, body, open = false) {
  return `
    <div class="accordion-item">
      <h2 class="accordion-header">
        <button class="accordion-button ${open ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${id}">
          ${escapeHtml(title)}
        </button>
      </h2>
      <div id="${id}" class="accordion-collapse collapse ${open ? 'show' : ''}" data-bs-parent="#contentAccordion">
        <div class="accordion-body">${body}</div>
      </div>
    </div>
  `;
}

function renderEditorFields(fields) {
  return `<div class="row g-3">${fields.map(([path, label, type]) => `<div class="col-md-6">${editorControl(path, label, type)}</div>`).join('')}</div>`;
}

function editorControl(path, label, type = 'text') {
  const value = window.SurveyConfigUtils.getPath(surveyConfig, path, '');
  const textValue = Array.isArray(value) ? value.join('\n') : value;
  if (type === 'textarea' || type === 'textarea-array') {
    return `
      <label class="form-label small">${escapeHtml(label)}</label>
      <textarea class="form-control form-control-sm" rows="3" data-config-path="${escapeAttr(path)}" data-config-type="${escapeAttr(type)}">${escapeHtml(textValue)}</textarea>
    `;
  }
  return `
    <label class="form-label small">${escapeHtml(label)}</label>
    <input class="form-control form-control-sm" data-config-path="${escapeAttr(path)}" data-config-type="text" value="${escapeAttr(textValue)}">
  `;
}

function renderOptionGroup(group) {
  const field = surveyConfig.fields?.[group.fieldKey] || { options: [] };
  const options = Array.isArray(field.options) ? field.options : [];
  return `
    <div class="option-group mb-4" data-option-group="${escapeAttr(group.fieldKey)}" data-has-help="${group.help ? '1' : '0'}">
      <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
        <div>
          <h3 class="h6 mb-0">${escapeHtml(group.title)}</h3>
          <div class="small text-secondary">El ID interno queda fijo. Cambiá el texto visible; ocultá opciones si no querés que aparezcan en la encuesta.</div>
        </div>
        <button class="btn btn-sm btn-outline-secondary" type="button" data-action="add-option" data-field-key="${escapeAttr(group.fieldKey)}">Agregar opción</button>
      </div>
      <div class="option-editor-list">
        ${options.map(option => renderOptionRow(option, group.help)).join('')}
      </div>
    </div>
  `;
}

function renderOptionRow(option, hasHelp) {
  return `
    <div class="option-editor-row" data-option-id="${escapeAttr(option.id)}">
      <div class="option-id"><code>${escapeHtml(option.id)}</code></div>
      <div>
        <label class="form-label small">Texto visible</label>
        <input class="form-control form-control-sm" data-option-field="label" value="${escapeAttr(option.label || '')}">
      </div>
      ${hasHelp ? `<div><label class="form-label small">Ayuda / descripción</label><input class="form-control form-control-sm" data-option-field="help" value="${escapeAttr(option.help || '')}"></div>` : '<div></div>'}
      <div class="form-check form-switch mt-4">
        <input class="form-check-input" type="checkbox" data-option-field="active" ${option.active !== false ? 'checked' : ''}>
        <label class="form-check-label small">Visible</label>
      </div>
      <div class="btn-group mt-4" role="group">
        <button class="btn btn-sm btn-outline-secondary" type="button" data-action="move-option-up" title="Subir"><i class="bi bi-arrow-up"></i></button>
        <button class="btn btn-sm btn-outline-secondary" type="button" data-action="move-option-down" title="Bajar"><i class="bi bi-arrow-down"></i></button>
      </div>
    </div>
  `;
}

function collectContentEditor() {
  const draft = window.SurveyConfigUtils.mergeDeep(window.DEFAULT_SURVEY_CONFIG, surveyConfig);
  document.querySelectorAll('[data-config-path]').forEach(input => {
    const path = input.getAttribute('data-config-path');
    const type = input.getAttribute('data-config-type');
    const value = type === 'textarea-array'
      ? input.value.split('\n').map(line => line.trim()).filter(Boolean)
      : input.value;
    window.SurveyConfigUtils.setPath(draft, path, value);
  });

  document.querySelectorAll('[data-option-group]').forEach(group => {
    const fieldKey = group.getAttribute('data-option-group');
    const hasHelp = group.getAttribute('data-has-help') === '1';
    const previousOptions = Array.isArray(surveyConfig.fields?.[fieldKey]?.options) ? surveyConfig.fields[fieldKey].options : [];
    const options = [...group.querySelectorAll('[data-option-id]')].map(row => {
      const id = row.getAttribute('data-option-id');
      const previous = previousOptions.find(item => String(item.id) === String(id));
      const label = row.querySelector('[data-option-field="label"]')?.value.trim() || id;
      const legacyLabels = new Set(Array.isArray(previous?.legacyLabels) ? previous.legacyLabels : []);
      if (previous?.label && previous.label !== label) legacyLabels.add(previous.label);
      const option = {
        id,
        label,
        active: row.querySelector('[data-option-field="active"]')?.checked !== false
      };
      if (legacyLabels.size) option.legacyLabels = [...legacyLabels];
      if (hasHelp) option.help = row.querySelector('[data-option-field="help"]')?.value.trim() || '';
      return option;
    });
    if (!draft.fields[fieldKey]) draft.fields[fieldKey] = {};
    draft.fields[fieldKey].options = options;
  });

  return draft;
}

async function saveSurveyConfig() {
  if (!supabaseClient) return;
  surveyConfig = collectContentEditor();
  try {
    const { error } = await supabaseClient
      .from('tourism_survey_config')
      .upsert({ id: 'default', content: surveyConfig, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
    applyAdminContent();
    hydrateFilters();
    applyFilters();
    showToast('Contenido actualizado. La encuesta pública ya usa estos textos.', 'success');
  } catch (error) {
    console.error(error);
    showToast(`No se pudo guardar la configuración: ${error.message}`, 'danger');
  }
}

async function reloadConfig() {
  await loadSurveyConfig();
  applyAdminContent();
  renderContentEditor();
  hydrateFilters();
  applyFilters();
  showToast('Contenido recargado.', 'success');
}

async function resetConfig() {
  const ok = window.prompt('Esto restaura el contenido base. Escribí RESTAURAR para confirmar.') === 'RESTAURAR';
  if (!ok) return;
  surveyConfig = window.SurveyConfigUtils.mergeDeep(window.DEFAULT_SURVEY_CONFIG, {});
  renderContentEditor();
  await saveSurveyConfig();
}

function handleContentEditorClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.getAttribute('data-action');
  if (action === 'add-option') {
    const fieldKey = button.getAttribute('data-field-key');
    addOptionRow(fieldKey);
  }
  if (action === 'move-option-up') {
    const row = button.closest('[data-option-id]');
    if (row?.previousElementSibling) row.parentElement.insertBefore(row, row.previousElementSibling);
  }
  if (action === 'move-option-down') {
    const row = button.closest('[data-option-id]');
    if (row?.nextElementSibling) row.parentElement.insertBefore(row.nextElementSibling, row);
  }
}

function addOptionRow(fieldKey) {
  const group = document.querySelector(`[data-option-group="${cssEscape(fieldKey)}"]`);
  if (!group) return;
  const label = window.prompt('Texto visible de la nueva opción:');
  if (!label) return;
  const existingIds = new Set([...group.querySelectorAll('[data-option-id]')].map(row => row.getAttribute('data-option-id')));
  let id = window.SurveyConfigUtils.slugify(label, 'opcion');
  let suffix = 2;
  while (existingIds.has(id)) id = `${window.SurveyConfigUtils.slugify(label, 'opcion')}_${suffix++}`;
  const hasHelp = group.getAttribute('data-has-help') === '1';
  group.querySelector('.option-editor-list')?.insertAdjacentHTML('beforeend', renderOptionRow({ id, label, help: '', active: true }, hasHelp));
}

function countArrayValues(rows, key) {
  const map = new Map();
  rows.forEach(row => optionLabels(key, row[key] || []).forEach(value => map.set(value, (map.get(value) || 0) + 1)));
  return map;
}

function countSingleValues(rows, key) {
  const map = new Map();
  rows.forEach(row => {
    const value = optionLabel(key, row[key]) || 'Sin dato';
    map.set(value, (map.get(value) || 0) + 1);
  });
  return map;
}

function topN(map, n) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a,b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, n);
}

function wordFrequency(text) {
  const map = new Map();
  normalize(text)
    .replace(/[^a-z0-9áéíóúüñ\s]/gi, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 4 && !STOPWORDS.has(word))
    .forEach(word => map.set(word, (map.get(word) || 0) + 1));
  return [...map.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function suggestService(problem) {
  const p = normalize(problem);
  if (p.includes('datos') || p.includes('evidencia')) return 'Observatorio turístico, tablero de indicadores y reportes ejecutivos automáticos.';
  if (p.includes('coordinacion') || p.includes('privada')) return 'Facilitación de mesa público-privada con agenda, acuerdos y seguimiento.';
  if (p.includes('promocion') || p.includes('conversion')) return 'Auditoría de funnel turístico y plan de captación de demanda medible.';
  if (p.includes('estacionalidad') || p.includes('ocupacion')) return 'Diseño de productos, calendario de eventos y estrategia de temporada baja.';
  if (p.includes('presupuesto') || p.includes('financiamiento')) return 'Formulación de proyectos, priorización de inversión y búsqueda de fondos.';
  if (p.includes('impacto') || p.includes('economico')) return 'Sistema de medición de impacto, ROI turístico y storytelling de gestión.';
  if (p.includes('oferta') || p.includes('comercializable')) return 'Desarrollo de productos y experiencias con manual comercial.';
  if (p.includes('digital')) return 'Auditoría digital integral y plan de mejora de presencia, reputación y conversión.';
  if (p.includes('capacitacion')) return 'Programa de capacitación para equipos y prestadores con indicadores de adopción.';
  if (p.includes('eventos') || p.includes('inversiones')) return 'Estrategia de captación de eventos/inversiones y carpeta comercial del destino.';
  if (p.includes('gobernanza') || p.includes('consensos')) return 'Modelo de gobernanza turística y metodología de consensos estratégicos.';
  return 'Diagnóstico estratégico corto y oferta modular según urgencia, impacto y presupuesto.';
}

function isPositivePayIntent(row) {
  const raw = normalize(row.willingness_to_pay || '');
  const label = normalize(optionLabel('willingness_to_pay', row.willingness_to_pay));
  return raw.startsWith('si') || raw.startsWith('sí') || raw.startsWith('probablemente') || label.startsWith('si') || label.startsWith('sí') || label.startsWith('probablemente');
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function unique(values) {
  return [...new Set(values)];
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeKey(value) {
  return normalize(value).replace(/\s+/g, ' ');
}

function optionLabel(fieldKey, value) {
  return window.SurveyConfigUtils.optionLabel(surveyConfig, fieldKey, value);
}

function optionLabels(fieldKey, values) {
  return window.SurveyConfigUtils.optionLabels(surveyConfig, fieldKey, values);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? '';
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function csvEscape(value) {
  const string = String(value ?? '');
  return `"${string.replaceAll('"', '""')}"`;
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

function showToast(message, type = 'default') {
  const toastElement = document.getElementById('adminToast');
  const body = document.getElementById('adminToastBody');
  if (!toastElement || !body) return;

  body.textContent = message;
  toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
  if (type === 'success') toastElement.classList.add('text-bg-success');
  if (type === 'danger') toastElement.classList.add('text-bg-danger');
  if (type === 'warning') toastElement.classList.add('text-bg-warning');

  const toast = bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 3600 });
  toast.show();
}

document.addEventListener('DOMContentLoaded', async () => {
  supabaseClient = initSupabase();
  applyAdminContent();
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('refreshBtn')?.addEventListener('click', loadRows);
  document.getElementById('exportBtn')?.addEventListener('click', exportCsv);
  document.getElementById('pdfBtn')?.addEventListener('click', openPdfExportModal);
  document.getElementById('saveConfigBtn')?.addEventListener('click', saveSurveyConfig);
  document.getElementById('reloadConfigBtn')?.addEventListener('click', reloadConfig);
  document.getElementById('resetConfigBtn')?.addEventListener('click', resetConfig);
  document.getElementById('contentEditor')?.addEventListener('click', handleContentEditorClick);
  document.getElementById('deleteSelectedBtn')?.addEventListener('click', () => deleteResponses([...selectedResponseIds], 'selected'));
  document.getElementById('deleteFilteredBtn')?.addEventListener('click', () => deleteResponses(filteredRows.map(row => row.id), 'filtered'));
  document.getElementById('deleteConfirmationInput')?.addEventListener('input', syncDeleteConfirmation);
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', performConfirmedDeletion);
  document.getElementById('deleteConfirmationModal')?.addEventListener('shown.bs.modal', () => document.getElementById('deleteConfirmationInput')?.focus());
  document.getElementById('deleteConfirmationModal')?.addEventListener('hidden.bs.modal', () => {
    pendingDeletion = null;
    const input = document.getElementById('deleteConfirmationInput');
    if (input) input.value = '';
    syncDeleteConfirmation();
  });
  ['pdfIncludeReport', 'pdfIncludeResponses'].forEach(id => document.getElementById(id)?.addEventListener('change', syncPdfExportControls));
  document.getElementById('generatePdfBtn')?.addEventListener('click', generatePdfExport);
  document.getElementById('selectAllResponses')?.addEventListener('change', event => {
    if (event.currentTarget.checked) filteredRows.forEach(row => selectedResponseIds.add(row.id));
    else filteredRows.forEach(row => selectedResponseIds.delete(row.id));
    renderTable();
  });
  document.getElementById('responsesTable')?.addEventListener('change', event => {
    if (!event.target.matches('.response-check')) return;
    if (event.target.checked) selectedResponseIds.add(event.target.value);
    else selectedResponseIds.delete(event.target.value);
    syncSelectionControls();
  });
  document.getElementById('responsesTable')?.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = button.getAttribute('data-id');
    if (button.getAttribute('data-action') === 'view-response') showResponseDetail(id);
    if (button.getAttribute('data-action') === 'delete-response') deleteResponses([id], 'single');
  });
  ['filterLevel', 'filterProvince', 'filterProblem', 'filterSearch'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
  await checkSession();
});
