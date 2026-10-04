const appRoot = document.getElementById('app');

const state = {
  route: location.pathname,
  user: null,
  records: [],
  selectedRecord: null,
  loading: false,
  error: '',
  success: '',
};

function formatDate(dateString) {
  if (!dateString) return '—';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed.');
  }

  return payload;
}

function createLayout(content) {
  appRoot.innerHTML = content;
}

function renderLogin() {
  createLayout(`
    <div class="login-shell">
      <div class="login-panel">
        <h2>Marine Engineer Troubleshooting Journal</h2>
        <p class="muted-text">Sign in to manage equipment troubleshooting records.</p>
        ${state.error ? `<div class="alert error">${escapeHtml(state.error)}</div>` : ''}
        <form id="login-form" class="login-form">
          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="engineer@marinejournal.com" required />
          </div>
          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Password123!" required />
          </div>
          <button class="primary-button" type="submit">Login</button>
        </form>
      </div>
    </div>
  `);

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.error = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const result = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      state.user = result.user;
      state.success = 'Login successful.';
      history.pushState({}, '', '/dashboard');
      renderApp();
    } catch (error) {
      state.error = error.message;
      renderLogin();
    }
  });
}

async function loadSession() {
  try {
    const result = await apiFetch('/api/session');
    state.user = result.authenticated ? result.user : null;

    if (result.authenticated && state.route === '/login') {
      history.pushState({}, '', '/dashboard');
      state.route = '/dashboard';
    }
  } catch (error) {
    state.error = error.message;
  }
}

function renderDashboard() {
  const records = state.records || [];

  createLayout(`
    <div class="app-shell">
      <header class="topbar">
        <h1>Marine Engineer Troubleshooting Journal</h1>
        <div class="topbar-right">
          <div class="user-chip">${escapeHtml(state.user?.name || state.user?.email || '')}</div>
          <button id="logout-button" class="secondary-button" type="button">Logout</button>
          <button id="add-trouble-button" class="primary-button" type="button">+ Add New Trouble</button>
        </div>
      </header>

      ${state.success ? `<div class="alert success">${escapeHtml(state.success)}</div>` : ''}
      ${state.error ? `<div class="alert error">${escapeHtml(state.error)}</div>` : ''}

      <main class="page-card">
        <h2>Dashboard</h2>

        ${records.length === 0 ? `
          <div class="empty-state">
            <p>No troubleshooting records yet.</p>
            <button id="add-empty-button" class="primary-button" type="button">Add your first troubleshooting record</button>
          </div>
        ` : `
          <div class="records-table-wrap">
            <table class="records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                ${records
                  .map(
                    (record) => `
                      <tr>
                        <td>${formatDate(record.date)}</td>
                        <td>${escapeHtml(record.title)}</td>
                        <td>
                          <button class="link-button" type="button" data-action="view-details" data-id="${record.id}">View Details</button>
                        </td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `}
      </main>
    </div>
  `);

  document.getElementById('logout-button')?.addEventListener('click', async () => {
    await apiFetch('/api/logout', { method: 'POST' });
    state.user = null;
    state.records = [];
    state.selectedRecord = null;
    state.success = '';
    history.pushState({}, '', '/login');
    renderApp();
  });

  document.getElementById('add-trouble-button')?.addEventListener('click', () => {
    state.success = '';
    state.error = '';
    history.pushState({}, '', '/new');
    renderApp();
  });

  document.getElementById('add-empty-button')?.addEventListener('click', () => {
    state.success = '';
    state.error = '';
    history.pushState({}, '', '/new');
    renderApp();
  });

  document.querySelectorAll('[data-action="view-details"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      history.pushState({}, '', `/details/${id}`);
      renderApp();
    });
  });
}

function renderForm(record = null, mode = 'create') {
  const isEdit = mode === 'edit';
  const formRecord = record || {
    date: '',
    title: '',
    description: '',
    problem: '',
    observation: '',
    equipmentAffected: '',
    rootCause: '',
    correctiveActivity: '',
  };

  createLayout(`
    <div class="app-shell">
      <header class="topbar">
        <h1>Marine Engineer Troubleshooting Journal</h1>
        <div class="topbar-right">
          <div class="user-chip">${escapeHtml(state.user?.name || state.user?.email || '')}</div>
          <button id="back-dashboard" class="secondary-button" type="button">Back to Dashboard</button>
        </div>
      </header>

      <main class="form-card">
        <h2>${isEdit ? 'Edit Trouble' : 'Add New Trouble'}</h2>
        ${state.error ? `<div class="alert error">${escapeHtml(state.error)}</div>` : ''}
        <form id="trouble-form">
          <div class="form-grid">
            <div class="form-field full-width">
              <label for="title">Title</label>
              <input id="title" name="title" type="text" value="${escapeHtml(formRecord.title)}" required />
            </div>

            <div class="form-field">
              <label for="date">Date</label>
              <input id="date" name="date" type="date" value="${escapeHtml(formRecord.date)}" required />
            </div>

            <div class="form-field">
              <label for="equipmentAffected">Equipment Affected</label>
              <input id="equipmentAffected" name="equipmentAffected" type="text" value="${escapeHtml(formRecord.equipmentAffected)}" required />
            </div>

            <div class="form-field full-width">
              <label for="description">Description</label>
              <textarea id="description" name="description" required>${escapeHtml(formRecord.description)}</textarea>
            </div>

            <div class="form-field full-width">
              <label for="problem">Problem</label>
              <textarea id="problem" name="problem" required>${escapeHtml(formRecord.problem)}</textarea>
            </div>

            <div class="form-field full-width">
              <label for="observation">Observation</label>
              <textarea id="observation" name="observation" required>${escapeHtml(formRecord.observation)}</textarea>
            </div>

            <div class="form-field full-width">
              <label for="rootCause">Root Cause</label>
              <textarea id="rootCause" name="rootCause" required>${escapeHtml(formRecord.rootCause)}</textarea>
            </div>

            <div class="form-field full-width">
              <label for="correctiveActivity">Corrective Activity Taken</label>
              <textarea id="correctiveActivity" name="correctiveActivity" required>${escapeHtml(formRecord.correctiveActivity)}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button id="cancel-button" class="secondary-button" type="button">Cancel</button>
            <button class="primary-button" type="submit">${isEdit ? 'Save Changes' : 'Save Trouble'}</button>
          </div>
        </form>
      </main>
    </div>
  `);

  document.getElementById('back-dashboard')?.addEventListener('click', () => {
    history.pushState({}, '', '/dashboard');
    renderApp();
  });

  document.getElementById('cancel-button')?.addEventListener('click', () => {
    history.pushState({}, '', '/dashboard');
    renderApp();
  });

  document.getElementById('trouble-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    state.error = '';

    const payload = {
      title: document.getElementById('title').value.trim(),
      date: document.getElementById('date').value,
      description: document.getElementById('description').value.trim(),
      problem: document.getElementById('problem').value.trim(),
      observation: document.getElementById('observation').value.trim(),
      equipmentAffected: document.getElementById('equipmentAffected').value.trim(),
      rootCause: document.getElementById('rootCause').value.trim(),
      correctiveActivity: document.getElementById('correctiveActivity').value.trim(),
    };

    try {
      if (isEdit) {
        await apiFetch(`/api/troubleshooting/${record.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        state.success = 'Troubleshooting record updated successfully.';
      } else {
        await apiFetch('/api/troubleshooting', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        state.success = 'Troubleshooting record created successfully.';
      }

      history.pushState({}, '', '/dashboard');
      renderApp();
    } catch (error) {
      state.error = error.message;
      renderForm(record, mode);
    }
  });
}

function renderDetails(record) {
  createLayout(`
    <div class="app-shell">
      <header class="topbar">
        <h1>Marine Engineer Troubleshooting Journal</h1>
        <div class="topbar-right">
          <div class="user-chip">${escapeHtml(state.user?.name || state.user?.email || '')}</div>
          <button id="back-dashboard" class="secondary-button" type="button">Back to Dashboard</button>
        </div>
      </header>

      <main class="page-card details-layout">
        <div>
          <h2>${escapeHtml(record.title)}</h2>
          <p class="muted-text">${formatDate(record.date)}</p>
        </div>

        <div class="section">
          <h3>Description</h3>
          <p>${escapeHtml(record.description)}</p>
        </div>

        <div class="section">
          <h3>Problem</h3>
          <p>${escapeHtml(record.problem)}</p>
        </div>

        <div class="section">
          <h3>Observation</h3>
          <p>${escapeHtml(record.observation)}</p>
        </div>

        <div class="section">
          <h3>Equipment Affected</h3>
          <p>${escapeHtml(record.equipmentAffected)}</p>
        </div>

        <div class="section">
          <h3>Root Cause</h3>
          <p>${escapeHtml(record.rootCause)}</p>
        </div>

        <div class="section">
          <h3>Corrective Activity Taken</h3>
          <p>${escapeHtml(record.correctiveActivity)}</p>
        </div>

        <div class="section">
          <h3>Issue Occurrence Count</h3>
          <p class="issue-count">Issue appeared: ${record.issueOccurrenceCount} times</p>
        </div>

        <div class="details-actions">
          <button id="edit-button" class="secondary-button" type="button">Edit</button>
          <button id="delete-button" class="danger-button" type="button">Delete</button>
          <button id="back-dashboard-2" class="primary-button" type="button">Back to Dashboard</button>
        </div>
      </main>
    </div>
  `);

  document.getElementById('back-dashboard')?.addEventListener('click', () => {
    history.pushState({}, '', '/dashboard');
    renderApp();
  });

  document.getElementById('back-dashboard-2')?.addEventListener('click', () => {
    history.pushState({}, '', '/dashboard');
    renderApp();
  });

  document.getElementById('edit-button')?.addEventListener('click', () => {
    history.pushState({}, '', `/edit/${record.id}`);
    renderApp();
  });

  document.getElementById('delete-button')?.addEventListener('click', async () => {
    const confirmed = window.confirm('Delete this troubleshooting record?');

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/api/troubleshooting/${record.id}`, { method: 'DELETE' });
      state.success = 'Troubleshooting record deleted successfully.';
      history.pushState({}, '', '/dashboard');
      renderApp();
    } catch (error) {
      state.error = error.message;
      renderApp();
    }
  });
}

async function renderApp() {
  state.route = location.pathname;

  if (state.route === '/login' || state.route === '/') {
    if (!state.user) {
      renderLogin();
      return;
    }

    state.route = '/dashboard';
    history.pushState({}, '', '/dashboard');
  }

  if (!state.user) {
    await loadSession();
    if (!state.user) {
      renderLogin();
      return;
    }
  }

  if (state.route.startsWith('/details/')) {
    const id = state.route.split('/details/')[1];
    try {
      const result = await apiFetch(`/api/troubleshooting/${id}`);
      renderDetails(result.record);
    } catch (error) {
      state.error = error.message;
      history.pushState({}, '', '/dashboard');
      renderDashboard();
    }
    return;
  }

  if (state.route.startsWith('/edit/')) {
    const id = state.route.split('/edit/')[1];
    try {
      const result = await apiFetch(`/api/troubleshooting/${id}`);
      renderForm(result.record, 'edit');
    } catch (error) {
      state.error = error.message;
      history.pushState({}, '', '/dashboard');
      renderDashboard();
    }
    return;
  }

  if (state.route === '/new') {
    renderForm();
    return;
  }

  if (state.route === '/dashboard') {
    try {
      state.loading = true;
      const result = await apiFetch('/api/troubleshooting');
      state.records = result.records;
      state.loading = false;
      renderDashboard();
    } catch (error) {
      state.loading = false;
      state.error = error.message;
      renderDashboard();
    }
    return;
  }

  renderDashboard();
}

window.addEventListener('popstate', renderApp);

renderApp();
