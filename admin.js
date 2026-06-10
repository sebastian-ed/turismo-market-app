let supabaseClient = null;
let allRows = [];
let filteredRows = [];
let charts = {};
const CHART_PALETTE = ['#2f4a60', '#516b7f', '#7a8791', '#9aa3aa', '#b8bec4', '#6f5f4c', '#8a6418', '#5f6f52'];

const STOPWORDS = new Set([
  'para','como','pero','porque','sobre','entre','desde','hasta','donde','cuando','este','esta','esto','estas','estos','tiene','tener','tenemos','necesitamos','necesito','hace','hacer','mas','más','muy','con','sin','los','las','una','uno','unos','unas','del','que','por','son','ser','ese','esa','eso','hay','hoy','nos','les','sus','mis','tus','todo','toda','todos','todas','cada','algo','bien','mal','tambien','también','solo','sólo','otro','otra','otros','otras','turismo','turistica','turístico','turísticas','turisticos','destino','destinos','gestion','gestión'
]);

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
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard(data.session.user.email);
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
    showDashboard(data.user.email);
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
    hydrateFilters();
    applyFilters();
    showToast('Datos actualizados.', 'success');
  } catch (error) {
    console.error(error);
    showToast(`No se pudieron cargar los datos: ${error.message}`, 'danger');
  }
}

function hydrateFilters() {
  fillSelect('filterLevel', unique(allRows.map(r => r.government_level).filter(Boolean)));
  fillSelect('filterProvince', unique(allRows.map(r => r.province).filter(Boolean)));
  fillSelect('filterProblem', unique(allRows.flatMap(r => r.top_problems || []).filter(Boolean)));
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  if (!select) return;
  const current = select.value;
  const first = select.options[0]?.outerHTML || '<option value="">Todos</option>';
  select.innerHTML = first + values.sort((a,b) => a.localeCompare(b)).map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  if (values.includes(current)) select.value = current;
}

function applyFilters() {
  const level = document.getElementById('filterLevel')?.value || '';
  const province = document.getElementById('filterProvince')?.value || '';
  const problem = document.getElementById('filterProblem')?.value || '';
  const search = normalize(document.getElementById('filterSearch')?.value || '');

  filteredRows = allRows.filter(row => {
    const levelOk = !level || row.government_level === level;
    const provinceOk = !province || row.province === province;
    const problemOk = !problem || (row.top_problems || []).includes(problem);
    const text = normalize([
      row.jurisdiction_name, row.province, row.role_title, row.organization, row.hair_on_fire,
      row.current_workaround, row.success_metric, row.evidence_notes, row.top_problem_other,
      row.desired_service_other, ...(row.top_problems || []), ...(row.desired_services || [])
    ].join(' '));
    const searchOk = !search || text.includes(search);
    return levelOk && provinceOk && problemOk && searchOk;
  });

  renderDashboard();
}

function renderDashboard() {
  const hasRows = allRows.length > 0;
  document.getElementById('emptyState')?.classList.toggle('d-none', hasRows);
  document.getElementById('dashboardContent')?.classList.toggle('d-none', !hasRows);
  if (!hasRows) return;

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
    (row.top_problems || []).forEach(problem => {
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
    row.desired_service_other
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
  tbody.innerHTML = filteredRows.map(row => `
    <tr>
      <td>${formatDate(row.created_at)}</td>
      <td><strong>${escapeHtml(row.jurisdiction_name || '')}</strong><br><span class="text-secondary small">${escapeHtml(row.province || '')}</span></td>
      <td>${escapeHtml(row.government_level || '')}<br><span class="text-secondary small">${escapeHtml(row.decision_role || '')}</span></td>
      <td class="truncate-cell" title="${escapeHtml((row.top_problems || []).join(', '))}">${escapeHtml((row.top_problems || []).join(', '))}</td>
      <td>${row.urgency || ''}</td>
      <td>${row.impact || ''}</td>
      <td class="truncate-cell" title="${escapeHtml(row.willingness_to_pay || '')}">${escapeHtml(row.willingness_to_pay || '')}</td>
      <td class="truncate-cell" title="${escapeHtml(row.hair_on_fire || '')}">${escapeHtml(row.hair_on_fire || '')}</td>
      <td>${renderContact(row)}</td>
    </tr>
  `).join('');
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
  const csv = [headers.join(',')].concat(rows.map(row => headers.map(header => {
    const value = Array.isArray(row[header]) ? row[header].join(' | ') : (row[header] ?? '');
    return csvEscape(value);
  }).join(','))).join('\n');

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

function countArrayValues(rows, key) {
  const map = new Map();
  rows.forEach(row => (row[key] || []).forEach(value => map.set(value, (map.get(value) || 0) + 1)));
  return map;
}

function countSingleValues(rows, key) {
  const map = new Map();
  rows.forEach(row => {
    const value = row[key] || 'Sin dato';
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
  const value = normalize(row.willingness_to_pay || '');
  return value.startsWith('si') || value.startsWith('sí') || value.startsWith('probablemente');
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

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
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
  return encodeURIComponent(String(value ?? '').trim()).replaceAll('%40', '@');
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
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('refreshBtn')?.addEventListener('click', loadRows);
  document.getElementById('exportBtn')?.addEventListener('click', exportCsv);
  ['filterLevel', 'filterProvince', 'filterProblem', 'filterSearch'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
  await checkSession();
});
