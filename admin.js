let supabaseClient = null;
let allRows = [];
let filteredRows = [];
let charts = {};
let surveyConfig = window.SurveyConfigUtils.mergeDeep(window.DEFAULT_SURVEY_CONFIG, {});
let selectedResponseIds = new Set();

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
  ['logoutBtn', 'refreshBtn', 'exportBtn'].forEach(id => document.getElementById(id)?.classList.add('d-none'));
}

function showDashboard(email) {
  document.getElementById('loginSection')?.classList.add('d-none');
  document.getElementById('dashboardSection')?.classList.remove('d-none');
  ['logoutBtn', 'refreshBtn', 'exportBtn'].forEach(id => document.getElementById(id)?.classList.remove('d-none'));
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

async function deleteResponses(ids, mode = 'selected') {
  const targetIds = [...new Set(ids)].filter(Boolean);
  if (!targetIds.length) {
    showToast('No hay respuestas seleccionadas para eliminar.', 'warning');
    return;
  }

  let confirmed = false;
  if (targetIds.length === 1 && mode === 'single') {
    confirmed = window.confirm('¿Eliminar esta respuesta? Esta acción no se puede deshacer.');
  } else {
    const label = mode === 'filtered' ? `${targetIds.length} respuestas filtradas` : `${targetIds.length} respuestas seleccionadas`;
    confirmed = window.prompt(`Vas a eliminar ${label}. Escribí ELIMINAR para confirmar.`) === 'ELIMINAR';
  }
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from('tourism_market_responses')
      .delete()
      .in('id', targetIds);
    if (error) throw error;
    allRows = allRows.filter(row => !targetIds.includes(row.id));
    selectedResponseIds.clear();
    hydrateFilters();
    applyFilters();
    showToast(`Se eliminaron ${targetIds.length} respuesta(s).`, 'success');
  } catch (error) {
    console.error(error);
    showToast(`No se pudieron eliminar respuestas: ${error.message}`, 'danger');
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
  document.getElementById('saveConfigBtn')?.addEventListener('click', saveSurveyConfig);
  document.getElementById('reloadConfigBtn')?.addEventListener('click', reloadConfig);
  document.getElementById('resetConfigBtn')?.addEventListener('click', resetConfig);
  document.getElementById('contentEditor')?.addEventListener('click', handleContentEditorClick);
  document.getElementById('deleteSelectedBtn')?.addEventListener('click', () => deleteResponses([...selectedResponseIds], 'selected'));
  document.getElementById('deleteFilteredBtn')?.addEventListener('click', () => deleteResponses(filteredRows.map(row => row.id), 'filtered'));
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
