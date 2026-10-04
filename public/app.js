const appRoot = document.getElementById('app');

function isLiveServerContext() {
  return window.location.pathname.includes('/public/') || window.location.pathname.endsWith('/public/index.html');
}

function getRouteFromLocation() {
  if (window.location.hash.startsWith('#/')) {
    return window.location.hash.slice(1);
  }

  const pathname = window.location.pathname.replace(/\/+$/, '');
  const withoutPublic = pathname.startsWith('/public') ? pathname.slice('/public'.length) : pathname;

  if (!withoutPublic || withoutPublic === '/index.html') {
    return '/';
  }

  return withoutPublic.startsWith('/') ? withoutPublic : `/${withoutPublic}`;
}

function navigateToRoute(targetRoute) {
  const route = targetRoute.startsWith('/') ? targetRoute : `/${targetRoute}`;

  if (isLiveServerContext()) {
    if (window.location.hash !== `#${route}`) {
      window.location.hash = route;
    }
    return;
  }

  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

  if (currentPath !== route) {
    history.pushState({}, '', route);
  }
}

const state = {
  route: getRouteFromLocation(),
  user: null,
  records: [],
  discoverUsers: [],
  selectedProfile: null,
  selectedRecord: null,
  query: '',
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

const API_BASE_URL = 'http://127.0.0.1:3000';

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
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

function renderAlert(type, message) {
  if (!message) return '';
  return `<div class="alert ${type}">${escapeHtml(message)}</div>`;
}

function attachRouteButtons() {
  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      state.error = '';
      state.success = '';
      navigateToRoute(button.dataset.route || '/');
      renderApp();
    });
  });
}

function renderAppShell(content) {
  createLayout(`
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-block">
          <p class="eyebrow">Marine Engineering Community</p>
          <h1>Marine Engineer Troubleshooting Journal</h1>
        </div>

        <div class="topbar-right">
          ${state.user ? `
            <nav class="nav-buttons">
              <button class="nav-button ${state.route === '/dashboard' ? 'active' : ''}" data-route="/dashboard" type="button">Dashboard</button>
              <button class="nav-button ${state.route === '/discover' ? 'active' : ''}" data-route="/discover" type="button">Discover</button>
              <button class="nav-button ${state.route === '/my-profile' ? 'active' : ''}" data-route="/my-profile" type="button">My Profile</button>
              <button class="primary-button small" data-route="/new" type="button">+ Add Trouble</button>
            </nav>
            <div class="user-chip">${escapeHtml(state.user.name || state.user.email)}</div>
            <button id="logout-button" class="secondary-button small" type="button">Logout</button>
          ` : ''}
        </div>
      </header>

      ${renderAlert('success', state.success)}
      ${renderAlert('error', state.error)}

      ${content}
    </div>
  `);

  document.getElementById('logout-button')?.addEventListener('click', async () => {
    await apiFetch('/api/logout', { method: 'POST' });
    state.user = null;
    state.records = [];
    state.discoverUsers = [];
    state.selectedProfile = null;
    state.selectedRecord = null;
    state.success = '';
    state.error = '';
    navigateToRoute('/login');
    renderApp();
  });

  attachRouteButtons();
}

function renderAuth(mode = 'login') {
  const isLogin = mode === 'login';

  createLayout(`
    <div class="auth-shell">
      <div class="auth-panel">
        <div class="auth-header">
          <p class="eyebrow">Marine engineering network</p>
          <h2>${isLogin ? 'Welcome back' : 'Create your profile'}</h2>
        </div>

        ${renderAlert('error', state.error)}

        <form id="auth-form" class="auth-form">
          ${!isLogin ? `
            <div class="form-field">
              <label for="name">Full name</label>
              <input id="name" name="name" type="text" required />
            </div>
          ` : ''}

          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required />
          </div>

          ${isLogin ? '' : `
            <div class="form-field">
              <label for="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            <div class="form-field">
              <label for="role">Role</label>
              <input id="role" name="role" type="text" placeholder="Senior Marine Engineer" required />
            </div>
            <div class="form-field">
              <label for="bio">Bio</label>
              <textarea id="bio" name="bio" placeholder="Tell other engineers about your specialties." required></textarea>
            </div>
            <div class="form-field">
              <label for="experience">Experience</label>
              <input id="experience" name="experience" type="text" placeholder="8 Years" />
            </div>
            <div class="form-field full-width">
              <label for="profilePhoto">Profile photo URL</label>
              <input id="profilePhoto" name="profilePhoto" type="url" placeholder="https://example.com/photo.jpg" />
            </div>
          `}

          <button class="primary-button" type="submit">${isLogin ? 'Login' : 'Register'}</button>
        </form>

        <p class="auth-switch">
          ${isLogin ? 'Need an account?' : 'Already have an account?'}
          <button class="link-button compact" type="button" data-route="${isLogin ? '/register' : '/login'}">${isLogin ? 'Create one' : 'Login here'}</button>
        </p>
      </div>
    </div>
  `);

  document.getElementById('auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    state.error = '';

    if (isLogin) {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const result = await apiFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        state.user = result.user;
        state.success = 'Login successful.';
        navigateToRoute('/dashboard');
        renderApp();
      } catch (error) {
        state.error = error.message;
        renderAuth('login');
      }

      return;
    }

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      role: document.getElementById('role').value.trim(),
      bio: document.getElementById('bio').value.trim(),
      experience: document.getElementById('experience').value.trim(),
      profilePhoto: document.getElementById('profilePhoto').value.trim(),
    };

    try {
      const result = await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      state.user = result.user;
      state.success = 'Registration successful.';
      navigateToRoute('/dashboard');
      renderApp();
    } catch (error) {
      state.error = error.message;
      renderAuth('register');
    }
  });

  attachRouteButtons();
}

async function loadSession() {
  try {
    const result = await apiFetch('/api/session');
    state.user = result.authenticated ? result.user : null;

    if (result.authenticated && state.route === '/login') {
      state.route = '/dashboard';
      navigateToRoute('/dashboard');
    }
  } catch (error) {
    state.error = error.message;
  }
}

async function loadDashboard() {
  try {
    const profile = await apiFetch('/api/my-profile');
    state.selectedProfile = profile;
    state.records = profile.records || [];
    renderDashboard();
  } catch (error) {
    state.error = error.message;
    renderDashboard();
  }
}

function renderDashboard() {
  const profile = state.selectedProfile || { stats: { totalTroubleshootingCases: 0, totalLikes: 0, totalComments: 0 } };
  const stats = profile.stats || { totalTroubleshootingCases: 0, totalLikes: 0, totalComments: 0 };

  renderAppShell(`
    <main class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">Overview</p>
          <h2>Your dashboard</h2>
        </div>
        <button class="primary-button" data-route="/new" type="button">+ New troubleshooting entry</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Troubleshooting cases</span>
          <strong>${stats.totalTroubleshootingCases}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Likes received</span>
          <strong>${stats.totalLikes}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Comments received</span>
          <strong>${stats.totalComments}</strong>
        </div>
      </div>

      <div class="content-panel">
        <div class="panel-header">
          <h3>Recent troubleshooting records</h3>
        </div>

        ${state.records.length === 0 ? `
          <div class="empty-state">
            <p>You have not added any troubleshooting records yet.</p>
            <button class="primary-button" data-route="/new" type="button">Add your first record</button>
          </div>
        ` : `
          <div class="record-list">
            ${state.records.map((record) => `
              <article class="record-card">
                <div class="record-topline">
                  <div>
                    <p class="metadata">${formatDate(record.date)}</p>
                    <h4>${escapeHtml(record.equipmentAffected || '—')} — ${escapeHtml(record.problem || '—')}</h4>
                    <p class="metadata">${escapeHtml(record.title)}</p>
                  </div>
                  <span class="pill">Occurred: ${record.issueOccurrenceCount || 0} times</span>
                </div>
                <p class="record-description">${escapeHtml(record.description)}</p>
                <div class="record-meta">
                  <span>Equipment: ${escapeHtml(record.equipmentAffected || '—')}</span>
                  <span>Problem: ${escapeHtml(record.problem || '—')}</span>
                </div>
                <div class="record-actions">
                  <button class="secondary-button small" type="button" data-action="view-details" data-id="${record.id}">View details</button>
                  <button class="secondary-button small" type="button" data-action="edit-record" data-id="${record.id}">Edit</button>
                  <button class="danger-button small" type="button" data-action="delete-record" data-id="${record.id}">Delete</button>
                </div>
              </article>
            `).join('')}
          </div>
        `}
      </div>
    </main>
  `);

  document.querySelectorAll('[data-action="view-details"]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateToRoute(`/details/${button.dataset.id}`);
      renderApp();
    });
  });

  document.querySelectorAll('[data-action="edit-record"]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateToRoute(`/edit/${button.dataset.id}`);
      renderApp();
    });
  });

  document.querySelectorAll('[data-action="delete-record"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const confirmed = window.confirm('Delete this troubleshooting record?');
      if (!confirmed) return;

      try {
        await apiFetch(`/api/troubleshooting/${button.dataset.id}`, { method: 'DELETE' });
        state.success = 'Troubleshooting record deleted successfully.';
        await loadDashboard();
      } catch (error) {
        state.error = error.message;
        renderDashboard();
      }
    });
  });
}

async function loadDiscover() {
  try {
    const result = await apiFetch(`/api/discover?search=${encodeURIComponent(state.query)}`);
    state.discoverUsers = result.users || [];
    renderDiscover();
  } catch (error) {
    state.error = error.message;
    renderDiscover();
  }
}

function renderDiscover() {
  renderAppShell(`
    <main class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">Community</p>
          <h2>Discover engineers</h2>
        </div>
      </div>

      <form id="discover-search-form" class="toolbar-form">
        <input id="discover-search" type="text" value="${escapeHtml(state.query)}" placeholder="Search by name or role" />
        <button class="primary-button small" type="submit">Search</button>
      </form>

      <div class="content-panel">
        ${state.discoverUsers.length === 0 ? `
          <div class="empty-state">
            <p>No engineers matched your search.</p>
          </div>
        ` : `
          <div class="profile-grid">
            ${state.discoverUsers.map((user) => `
              <article class="profile-card">
                <div class="profile-card-header">
                  <div class="avatar">${escapeHtml((user.name || 'M').charAt(0).toUpperCase())}</div>
                  <div>
                    <h3>${escapeHtml(user.name)}</h3>
                    <p class="metadata">${escapeHtml(user.role || 'Marine Engineer')}</p>
                  </div>
                </div>
                <p class="card-bio">${escapeHtml(user.bio || 'No bio provided yet.')}</p>
                <div class="mini-stats">
                  <span>${user.totalTroubleshootingCases || 0} cases</span>
                </div>
                <button class="primary-button small" data-route="/profile/${user.id}" type="button">View profile</button>
              </article>
            `).join('')}
          </div>
        `}
      </div>
    </main>
  `);

  document.getElementById('discover-search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = document.getElementById('discover-search').value.trim();
    loadDiscover();
  });

  attachRouteButtons();
}

async function loadMyProfile() {
  try {
    const profile = await apiFetch('/api/my-profile');
    state.selectedProfile = profile;
    renderMyProfile();
  } catch (error) {
    state.error = error.message;
    renderMyProfile();
  }
}

function renderMyProfile() {
  const profile = state.selectedProfile;

  if (!profile) {
    renderAppShell('<main class="page-card"><p>Unable to load profile.</p></main>');
    return;
  }

  renderAppShell(`
    <main class="page-card">
      <div class="profile-header">
        <div class="avatar large">${escapeHtml((profile.name || 'M').charAt(0).toUpperCase())}</div>
        <div class="profile-copy">
          <p class="eyebrow">Engineer profile</p>
          <h2>${escapeHtml(profile.name)}</h2>
          <p class="metadata">${escapeHtml(profile.role || 'Marine Engineer')}</p>
          <p>${escapeHtml(profile.bio || 'No bio available.')}</p>
          <div class="meta-row">
            <span>${escapeHtml(profile.experience || 'Experience not specified')}</span>
            <span>${escapeHtml(profile.email)}</span>
          </div>
        </div>
        <div class="profile-actions">
          <button class="secondary-button" data-route="/edit-profile" type="button">Edit profile</button>
          <button class="primary-button" data-route="/new" type="button">+ Add record</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Cases</span>
          <strong>${profile.stats?.totalTroubleshootingCases || 0}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Likes</span>
          <strong>${profile.stats?.totalLikes || 0}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Comments</span>
          <strong>${profile.stats?.totalComments || 0}</strong>
        </div>
      </div>

      <div class="content-panel">
        <div class="panel-header">
          <h3>Your troubleshooting posts</h3>
        </div>

        ${profile.records?.length === 0 ? `
          <div class="empty-state">
            <p>No records yet.</p>
          </div>
        ` : `
          <div class="record-list">
            ${profile.records.map((record) => `
              <article class="record-card">
                <div class="record-topline">
                  <div>
                    <p class="metadata">${formatDate(record.date)}</p>
                    <h4>${escapeHtml(record.equipmentAffected || '—')} — ${escapeHtml(record.problem || '—')}</h4>
                    <p class="metadata">${escapeHtml(record.title)}</p>
                  </div>
                  <span class="pill">Occurred: ${record.issueOccurrenceCount || 0} times</span>
                </div>
                <p class="record-description">${escapeHtml(record.description)}</p>
                <div class="record-actions">
                  <button class="secondary-button small" type="button" data-action="view-details" data-id="${record.id}">View details</button>
                  <button class="secondary-button small" type="button" data-action="edit-record" data-id="${record.id}">Edit</button>
                  <button class="danger-button small" type="button" data-action="delete-record" data-id="${record.id}">Delete</button>
                </div>
              </article>
            `).join('')}
          </div>
        `}
      </div>
    </main>
  `);

  document.querySelectorAll('[data-action="view-details"]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateToRoute(`/details/${button.dataset.id}`);
      renderApp();
    });
  });

  document.querySelectorAll('[data-action="edit-record"]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateToRoute(`/edit/${button.dataset.id}`);
      renderApp();
    });
  });

  document.querySelectorAll('[data-action="delete-record"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const confirmed = window.confirm('Delete this troubleshooting record?');
      if (!confirmed) return;

      try {
        await apiFetch(`/api/troubleshooting/${button.dataset.id}`, { method: 'DELETE' });
        state.success = 'Troubleshooting record deleted successfully.';
        await loadMyProfile();
      } catch (error) {
        state.error = error.message;
        renderMyProfile();
      }
    });
  });

  attachRouteButtons();
}

async function loadProfile(profileId) {
  try {
    const profile = await apiFetch(`/api/users/${profileId}`);
    state.selectedProfile = profile;
    renderProfile();
  } catch (error) {
    state.error = error.message;
    renderProfile();
  }
}

function renderProfile() {
  const profile = state.selectedProfile;

  if (!profile) {
    renderAppShell('<main class="page-card"><p>Unable to load profile.</p></main>');
    return;
  }

  renderAppShell(`
    <main class="page-card">
      <div class="profile-header">
        <div class="avatar large">${escapeHtml((profile.name || 'M').charAt(0).toUpperCase())}</div>
        <div class="profile-copy">
          <p class="eyebrow">Engineer profile</p>
          <h2>${escapeHtml(profile.name)}</h2>
          <p class="metadata">${escapeHtml(profile.role || 'Marine Engineer')}</p>
          <p>${escapeHtml(profile.bio || 'No bio available.')}</p>
          <div class="meta-row">
            <span>${escapeHtml(profile.experience || 'Experience not specified')}</span>
            <span>${escapeHtml(profile.email)}</span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Cases</span>
          <strong>${profile.stats?.totalTroubleshootingCases || 0}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Likes</span>
          <strong>${profile.stats?.totalLikes || 0}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Comments</span>
          <strong>${profile.stats?.totalComments || 0}</strong>
        </div>
      </div>

      <div class="content-panel">
        <div class="panel-header">
          <h3>${profile.isOwner ? 'Your troubleshooting posts' : `${escapeHtml(profile.name.split(' ')[0])}'s troubleshooting posts`}</h3>
        </div>

        ${(profile.records || []).length === 0 ? `
          <div class="empty-state">
            <p>No records available for this profile.</p>
          </div>
        ` : `
          <div class="record-list">
            ${profile.records.map((record) => `
              <article class="record-card">
                <div class="record-topline">
                  <div>
                    <p class="metadata">${formatDate(record.date)}</p>
                    <h4>${escapeHtml(record.title)}</h4>
                  </div>
                  <span class="pill">${record.issueOccurrenceCount} occurrences</span>
                </div>
                <p class="record-description">${escapeHtml(record.description)}</p>
                <div class="record-actions">
                  <button class="secondary-button small" type="button" data-action="view-details" data-id="${record.id}">View details</button>
                </div>
              </article>
            `).join('')}
          </div>
        `}
      </div>
    </main>
  `);

  document.querySelectorAll('[data-action="view-details"]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateToRoute(`/details/${button.dataset.id}`);
      renderApp();
    });
  });
}

function renderProfileForm(profile = state.user) {
  renderAppShell(`
    <main class="form-card">
      <div class="page-header narrow">
        <div>
          <p class="eyebrow">Profile settings</p>
          <h2>Edit profile</h2>
        </div>
      </div>

      <form id="profile-form" class="form-grid">
        <div class="form-field">
          <label for="profileName">Name</label>
          <input id="profileName" type="text" value="${escapeHtml(profile?.name || '')}" required />
        </div>

        <div class="form-field">
          <label for="profileRole">Role</label>
          <input id="profileRole" type="text" value="${escapeHtml(profile?.role || '')}" required />
        </div>

        <div class="form-field full-width">
          <label for="profileBio">Bio</label>
          <textarea id="profileBio" required>${escapeHtml(profile?.bio || '')}</textarea>
        </div>

        <div class="form-field full-width">
          <label for="profileExperience">Experience</label>
          <input id="profileExperience" type="text" value="${escapeHtml(profile?.experience || '')}" />
        </div>

        <div class="form-field full-width">
          <label for="profilePhoto">Profile photo URL</label>
          <input id="profilePhoto" type="url" value="${escapeHtml(profile?.profilePhoto || '')}" />
        </div>

        <div class="form-actions full-width">
          <button class="secondary-button" type="button" data-route="/my-profile">Cancel</button>
          <button class="primary-button" type="submit">Save changes</button>
        </div>
      </form>
    </main>
  `);

  document.getElementById('profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById('profileName').value.trim(),
      role: document.getElementById('profileRole').value.trim(),
      bio: document.getElementById('profileBio').value.trim(),
      experience: document.getElementById('profileExperience').value.trim(),
      profilePhoto: document.getElementById('profilePhoto').value.trim(),
    };

    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      state.success = 'Profile updated successfully.';
      navigateToRoute('/my-profile');
      renderApp();
    } catch (error) {
      state.error = error.message;
      renderProfileForm(profile);
    }
  });

  attachRouteButtons();
}

async function loadEditProfile() {
  try {
    const profile = await apiFetch('/api/my-profile');
    renderProfileForm(profile);
  } catch (error) {
    state.error = error.message;
    renderProfileForm();
  }
}

async function loadEditRecord(id) {
  try {
    const result = await apiFetch(`/api/troubleshooting/${id}`);
    renderForm(result.record, 'edit');
  } catch (error) {
    state.error = error.message;
    navigateToRoute('/dashboard');
    renderApp();
  }
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

  renderAppShell(`
    <main class="form-card">
      <div class="page-header narrow">
        <div>
          <p class="eyebrow">Troubleshooting</p>
          <h2>${isEdit ? 'Edit troubleshooting record' : 'Add troubleshooting record'}</h2>
        </div>
      </div>

      <form id="trouble-form" class="form-grid">
        <div class="form-field full-width">
          <label for="title">Title</label>
          <input id="title" type="text" value="${escapeHtml(formRecord.title)}" required />
        </div>
        <div class="form-field">
          <label for="date">Date</label>
          <input id="date" type="date" value="${escapeHtml(formRecord.date)}" required />
        </div>
        <div class="form-field">
          <label for="equipmentAffected">Equipment affected</label>
          <input id="equipmentAffected" type="text" value="${escapeHtml(formRecord.equipmentAffected)}" required />
        </div>
        <div class="form-field full-width">
          <label for="description">Description</label>
          <textarea id="description" required>${escapeHtml(formRecord.description)}</textarea>
        </div>
        <div class="form-field full-width">
          <label for="problem">Problem</label>
          <textarea id="problem" required>${escapeHtml(formRecord.problem)}</textarea>
        </div>
        <div class="form-field full-width">
          <label for="observation">Observation</label>
          <textarea id="observation" required>${escapeHtml(formRecord.observation)}</textarea>
        </div>
        <div class="form-field full-width">
          <label for="rootCause">Root cause</label>
          <textarea id="rootCause" required>${escapeHtml(formRecord.rootCause)}</textarea>
        </div>
        <div class="form-field full-width">
          <label for="correctiveActivity">Corrective activity taken</label>
          <textarea id="correctiveActivity" required>${escapeHtml(formRecord.correctiveActivity)}</textarea>
        </div>

        <div class="form-actions full-width">
          <button class="secondary-button" type="button" data-route="/dashboard">Cancel</button>
          <button class="primary-button" type="submit">${isEdit ? 'Save changes' : 'Save record'}</button>
        </div>
      </form>
    </main>
  `);

  document.getElementById('trouble-form').addEventListener('submit', async (event) => {
    event.preventDefault();

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

      navigateToRoute('/dashboard');
      renderApp();
    } catch (error) {
      state.error = error.message;
      renderForm(record, mode);
    }
  });

  attachRouteButtons();
}

async function loadDetails() {
  const id = state.route.split('/details/')[1];

  try {
    const result = await apiFetch(`/api/troubleshooting/${id}`);
    state.selectedRecord = result.record;
    renderDetails();
  } catch (error) {
    state.error = error.message;
    navigateToRoute('/dashboard');
    renderApp();
  }
}

function renderDetails() {
  const record = state.selectedRecord;

  if (!record) {
    renderAppShell('<main class="page-card"><p>Unable to load this troubleshooting record.</p></main>');
    return;
  }

  const commentsMarkup = (record.comments || []).length
    ? (record.comments || []).map((comment) => `
      <div class="comment-item">
        <div class="comment-header">
          <strong>${escapeHtml(comment.userName || 'Engineer')}</strong>
          <span>${formatDate(comment.createdAt)}</span>
        </div>
        <p>${escapeHtml(comment.text)}</p>
        ${Number(comment.userId) === Number(state.user?.id) ? `
          <button class="link-button compact danger" type="button" data-action="delete-comment" data-comment-id="${comment.id}">Delete</button>
        ` : ''}
      </div>
    `).join('')
    : '<p class="empty-inline">No comments yet.</p>';

  const occurrenceHistoryMarkup = (record.occurrenceHistory || []).length
    ? (record.occurrenceHistory || []).map((item) => `
      <div class="comment-item">
        <div class="comment-header">
          <strong>${formatDate(item.date)}</strong>
          <span>${escapeHtml(item.title || 'Troubleshooting case')}</span>
        </div>
        <p><strong>Observation:</strong> ${escapeHtml(item.observation || 'No observation recorded.')}</p>
        <p><strong>Root cause:</strong> ${escapeHtml(item.rootCause || 'No root cause recorded.')}</p>
        <p><strong>Corrective activity:</strong> ${escapeHtml(item.correctiveActivity || 'No corrective activity recorded.')}</p>
      </div>
    `).join('')
    : '<p class="empty-inline">No prior occurrences found.</p>';

  renderAppShell(`
    <main class="page-card details-layout">
      <div class="details-header">
        <div>
          <p class="eyebrow">Troubleshooting case</p>
          <h2>${escapeHtml(record.title)}</h2>
        </div>
        <div class="details-actions">
          <button class="secondary-button small" data-route="/dashboard" type="button">Back to dashboard</button>
        </div>
      </div>

      <div class="details-summary">
        <div class="summary-item">
          <span>Date</span>
          <strong>${formatDate(record.date)}</strong>
        </div>
        <div class="summary-item">
          <span>Equipment</span>
          <strong>${escapeHtml(record.equipmentAffected || '—')}</strong>
        </div>
        <div class="summary-item">
          <span>Occurred</span>
          <strong>${record.issueOccurrenceCount || 0} times</strong>
        </div>
      </div>

      <div class="section-grid">
        <section class="detail-section">
          <h3>Description</h3>
          <p>${escapeHtml(record.description)}</p>
        </section>
        <section class="detail-section">
          <h3>Problem</h3>
          <p>${escapeHtml(record.problem)}</p>
        </section>
        <section class="detail-section">
          <h3>Observation</h3>
          <p>${escapeHtml(record.observation)}</p>
        </section>
        <section class="detail-section">
          <h3>Root cause</h3>
          <p>${escapeHtml(record.rootCause)}</p>
        </section>
        <section class="detail-section">
          <h3>Corrective activity</h3>
          <p>${escapeHtml(record.correctiveActivity)}</p>
        </section>
        <section class="detail-section">
          <h3>Author</h3>
          <p>${escapeHtml(record.ownerName || 'Marine Engineer')}</p>
          <p class="metadata">${escapeHtml(record.ownerRole || 'Marine Engineer')}</p>
        </section>
      </div>

      <div class="detail-bottom-bar">
        <div class="social-actions">
          <button class="secondary-button small" type="button" data-action="toggle-like">
            ${record.liked ? 'Unlike' : 'Like'} (${record.likeCount || 0})
          </button>
          ${record.isOwner ? `
            <button class="secondary-button small" type="button" data-action="edit-record" data-id="${record.id}">Edit</button>
            <button class="danger-button small" type="button" data-action="delete-record" data-id="${record.id}">Delete</button>
          ` : ''}
        </div>
      </div>

      <div class="content-panel comments-panel">
        <div class="panel-header">
          <h3>Occurrence history</h3>
        </div>
        ${occurrenceHistoryMarkup}
      </div>

      <div class="content-panel comments-panel">
        <div class="panel-header">
          <h3>Comments</h3>
        </div>

        ${commentsMarkup}

        <form id="comment-form" class="comment-form">
          <textarea id="comment-text" placeholder="Add a comment about this troubleshooting case..." required></textarea>
          <button class="primary-button small" type="submit">Post comment</button>
        </form>
      </div>
    </main>
  `);

  document.querySelectorAll('[data-action="toggle-like"]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await apiFetch(`/api/troubleshooting/${record.id}/like`, { method: 'POST' });
        await loadDetails();
      } catch (error) {
        state.error = error.message;
        renderDetails();
      }
    });
  });

  document.querySelectorAll('[data-action="edit-record"]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateToRoute(`/edit/${button.dataset.id}`);
      renderApp();
    });
  });

  document.querySelectorAll('[data-action="delete-record"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const confirmed = window.confirm('Delete this troubleshooting record?');
      if (!confirmed) return;

      try {
        await apiFetch(`/api/troubleshooting/${button.dataset.id}`, { method: 'DELETE' });
        state.success = 'Troubleshooting record deleted successfully.';
        navigateToRoute('/dashboard');
        renderApp();
      } catch (error) {
        state.error = error.message;
        renderDetails();
      }
    });
  });

  document.querySelectorAll('[data-action="delete-comment"]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await apiFetch(`/api/troubleshooting/${record.id}/comments/${button.dataset.commentId}`, { method: 'DELETE' });
        state.success = 'Comment deleted successfully.';
        await loadDetails();
      } catch (error) {
        state.error = error.message;
        renderDetails();
      }
    });
  });

  document.getElementById('comment-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = document.getElementById('comment-text').value.trim();

    if (!text) return;

    try {
      await apiFetch(`/api/troubleshooting/${record.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      document.getElementById('comment-text').value = '';
      state.success = 'Comment posted.';
      await loadDetails();
    } catch (error) {
      state.error = error.message;
      renderDetails();
    }
  });

  attachRouteButtons();
}

async function renderApp() {
  state.route = getRouteFromLocation();

  if (!state.user) {
    await loadSession();

    if (!state.user) {
      if (state.route === '/register') {
        renderAuth('register');
        return;
      }

      navigateToRoute('/login');
      renderAuth('login');
      return;
    }
  }

  if (state.route === '/' || state.route === '/login') {
    navigateToRoute('/dashboard');
    state.route = '/dashboard';
  }

  if (state.route === '/register' && state.user) {
    navigateToRoute('/dashboard');
    state.route = '/dashboard';
  }

  if (state.route === '/dashboard') {
    await loadDashboard();
    return;
  }

  if (state.route === '/discover') {
    loadDiscover();
    return;
  }

  if (state.route === '/my-profile') {
    await loadMyProfile();
    return;
  }

  if (state.route.startsWith('/profile/')) {
    const profileId = state.route.split('/profile/')[1];
    await loadProfile(profileId);
    return;
  }

  if (state.route.startsWith('/details/')) {
    await loadDetails();
    return;
  }

  if (state.route === '/new') {
    renderForm();
    return;
  }

  if (state.route.startsWith('/edit/')) {
    const id = state.route.split('/edit/')[1];
    await loadEditRecord(id);
    return;
  }

  if (state.route === '/edit-profile') {
    await loadEditProfile();
    return;
  }

  navigateToRoute('/dashboard');
  state.route = '/dashboard';
  await loadDashboard();
}

window.addEventListener('popstate', renderApp);
window.addEventListener('hashchange', renderApp);
renderApp();
