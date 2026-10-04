// VolunNet Dashboard Controller - Fixed & Robust Data Extraction

const API_BASE = window.location.origin;

let currentUser = JSON.parse(localStorage.getItem('volunnet_user')) || null;
let authToken = localStorage.getItem('volunnet_token') || null;
let socket = null;
let userSignups = [];

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSocket();
  initForms();
  initAuthModal();

  if (authToken && currentUser) {
    updateRoleBadge();
    refreshData();
  } else {
    // Auto login demo volunteer so page immediately shows live data
    autoLoginVolunteer();
  }
});

function showToast(msg, title = 'Notification', isError = false) {
  const box = document.getElementById('toastBox');
  if (!box) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) toast.style.borderLeftColor = 'var(--danger)';
  toast.innerHTML = `<strong>${title}</strong>: ${msg}`;
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function initSocket() {
  const dot = document.getElementById('socketDot');
  const text = document.getElementById('socketText');

  if (typeof io === 'undefined') {
    if (dot) dot.style.background = 'var(--danger)';
    if (text) text.textContent = 'Offline';
    return;
  }

  socket = io(API_BASE);
  socket.on('connect', () => {
    if (dot) dot.style.background = 'var(--success)';
    if (text) text.textContent = 'Live';
    if (currentUser && currentUser.id) socket.emit('joinUser', currentUser.id);
  });

  socket.on('disconnect', () => {
    if (dot) dot.style.background = 'var(--danger)';
    if (text) text.textContent = 'Disconnected';
  });

  socket.on('eventAvailability', (data) => {
    updateEventSlot(data.eventId, data.availableSlots, data.capacity);
    fetchImpactStats();
  });

  socket.on('notification', (data) => {
    showToast(data.message, data.title);
  });
}

function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetView = document.getElementById(`tab-${tabId}`);
      if (targetView) targetView.classList.add('active');

      if (tabId === 'overview') fetchEvents();
      if (tabId === 'hours') { fetchEventsForSelect(); fetchHours(); fetchBadges(); }
      if (tabId === 'certificates') fetchCertificates();
    });
  });
}

function updateRoleBadge() {
  const badge = document.getElementById('roleBadge');
  if (!badge) return;
  if (!currentUser) {
    badge.textContent = 'Guest Mode';
    return;
  }
  const isAdmin = currentUser.role === 'admin';
  badge.textContent = isAdmin ? `👑 Admin: ${currentUser.name}` : `👤 Volunteer: ${currentUser.name}`;
  badge.style.background = isAdmin ? 'var(--warning-light)' : 'var(--primary-light)';
  badge.style.color = isAdmin ? 'var(--warning)' : '#818cf8';
}

async function refreshData() {
  await fetchImpactStats();
  await fetchEvents();
}

async function fetchImpactStats() {
  try {
    const res = await fetch(`${API_BASE}/api/reports/impact`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById('statVolunteers').textContent = data.totalVolunteers ?? 0;
    document.getElementById('statEvents').textContent = data.totalEvents ?? 0;
    document.getElementById('statHours').textContent = `${data.totalHours ?? 0} hrs`;
  } catch (err) {}
}

async function fetchEvents() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/api/events`, { headers: getAuthHeaders() });
    if (!res.ok) {
      grid.innerHTML = `<div style="color: var(--text-muted); padding: 1.5rem;">Sign in to view events.</div>`;
      return;
    }

    const data = await res.json();
    // Fix: controller returns { message: "...", events: [...] }
    const events = Array.isArray(data) ? data : (data.events || []);

    if (currentUser) {
      const sRes = await fetch(`${API_BASE}/api/signups/user/${currentUser.id}`, { headers: getAuthHeaders() });
      if (sRes.ok) {
        const sData = await sRes.json();
        userSignups = Array.isArray(sData) ? sData : (sData.signups || []);
      }
    }

    if (!events || events.length === 0) {
      grid.innerHTML = `<div style="color: var(--text-muted); padding: 1.5rem;">No volunteer events available yet. Use Admin tab to create one!</div>`;
      return;
    }

    grid.innerHTML = events.map(evt => {
      const availableSlots = evt.availableSlots ?? evt.capacity ?? 0;
      const capacity = evt.capacity ?? 1;
      const isFull = availableSlots <= 0;
      const pct = Math.min(100, Math.max(0, Math.round(((capacity - availableSlots) / capacity) * 100)));
      
      const activeSignup = userSignups.find(s => {
        const sEvtId = s.event ? (s.event._id || s.event) : null;
        return sEvtId === evt._id && s.status === 'registered';
      });

      return `
        <div class="card" id="card-${evt._id}">
          <div>
            <h3 class="card-title">${evt.title}</h3>
            <p class="card-desc">${evt.description || 'No description provided.'}</p>
            <div class="card-meta">
              <div>📍 Location: ${evt.location}</div>
              <div>📅 Date: ${new Date(evt.date).toLocaleDateString()}</div>
            </div>
          </div>

          <div>
            <div class="progress-container">
              <div class="progress-label">
                <span>Slots Filled</span>
                <span id="slot-text-${evt._id}">${capacity - availableSlots} / ${capacity}</span>
              </div>
              <div class="progress-bg">
                <div class="progress-bar" id="slot-bar-${evt._id}" style="width: ${pct}%"></div>
              </div>
            </div>

            ${activeSignup ? `
              <button class="btn btn-danger btn-full btn-sm" onclick="cancelSignupAction('${activeSignup._id}')">
                Cancel Registration
              </button>
            ` : `
              <button class="btn btn-full btn-sm ${isFull ? 'btn-secondary' : ''}" ${isFull ? 'disabled' : ''} onclick="registerEventAction('${evt._id}')">
                ${isFull ? 'Full' : 'Sign Up'}
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("fetchEvents error:", err);
    grid.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Error loading events. Please check connection.</div>`;
  }
}

function updateEventSlot(eventId, availableSlots, capacity) {
  const text = document.getElementById(`slot-text-${eventId}`);
  const bar = document.getElementById(`slot-bar-${eventId}`);
  if (text && bar) {
    const filled = capacity - availableSlots;
    const pct = Math.min(100, Math.max(0, Math.round((filled / capacity) * 100)));
    text.textContent = `${filled} / ${capacity}`;
    bar.style.width = `${pct}%`;
  }
}

async function registerEventAction(eventId) {
  try {
    const res = await fetch(`${API_BASE}/api/signups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ eventId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    showToast('Registered for event!', 'Success');
    fetchEvents();
    fetchImpactStats();
  } catch (err) {
    showToast(err.message, 'Error', true);
  }
}

async function cancelSignupAction(signupId) {
  try {
    const res = await fetch(`${API_BASE}/api/signups/${signupId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Cancellation failed');

    showToast('Signup cancelled.', 'Info');
    fetchEvents();
    fetchImpactStats();
  } catch (err) {
    showToast(err.message, 'Error', true);
  }
}

async function fetchEventsForSelect() {
  const select = document.getElementById('logEventSelect');
  if (!select) return;
  try {
    const res = await fetch(`${API_BASE}/api/events`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const events = Array.isArray(data) ? data : (data.events || []);

    select.innerHTML = `<option value="">-- Select Event --</option>` + 
      events.map(e => `<option value="${e._id}">${e.title}</option>`).join('');
  } catch (err) {}
}

async function fetchHours() {
  const tbody = document.getElementById('hoursTableBody');
  if (!tbody || !currentUser) return;

  try {
    const res = await fetch(`${API_BASE}/api/hours/user/${currentUser.id}`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.hours || []);

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No service hours logged yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(h => `
      <tr>
        <td><strong>${h.event ? (h.event.title || 'Event') : 'Volunteering'}</strong></td>
        <td>${h.hours} hrs</td>
        <td>${h.description || '-'}</td>
        <td>${new Date(h.date || h.createdAt).toLocaleDateString()}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteHourEntry('${h._id}')">Delete</button></td>
      </tr>
    `).join('');
  } catch (err) {}
}

async function deleteHourEntry(hourId) {
  try {
    const res = await fetch(`${API_BASE}/api/hours/${hourId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      showToast('Hour entry deleted.', 'Success');
      fetchHours();
      fetchBadges();
      fetchImpactStats();
    }
  } catch (err) {}
}

async function fetchBadges() {
  const container = document.getElementById('badgesContainer');
  if (!container || !currentUser) return;

  try {
    const res = await fetch(`${API_BASE}/api/badges/user/${currentUser.id}`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const badges = Array.isArray(data) ? data : (data.badges || []);

    if (badges.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem;">Log 5+ hours to earn your first Bronze Badge!</div>`;
      return;
    }

    container.innerHTML = badges.map(b => `
      <div style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.4rem;">${b.tier === 'bronze' ? '🥉' : b.tier === 'silver' ? '🥈' : b.tier === 'gold' ? '🥇' : '💎'}</span>
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">${b.title}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${b.description || `Unlocked at ${b.hoursRequired} hours.`}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {}
}

async function fetchCertificates() {
  const grid = document.getElementById('certificatesGrid');
  if (!grid || !currentUser) return;

  try {
    const res = await fetch(`${API_BASE}/api/certificates`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const certs = Array.isArray(data) ? data : (data.certificates || []);

    if (certs.length === 0) {
      grid.innerHTML = `<div style="color: var(--text-muted); padding: 2rem;">No certificates issued yet.</div>`;
      return;
    }

    grid.innerHTML = certs.map(c => `
      <div class="card" style="border-color: var(--warning);">
        <div>
          <h3 class="card-title" style="color: var(--warning);">${c.title}</h3>
          <p class="card-desc">${c.description || 'Awarded for volunteer service.'}</p>
        </div>
        <div style="border: 1px dashed var(--border-color); padding: 10px; border-radius: 6px; font-size: 0.8rem;">
          <div>Cert ID: ${c.certificateNumber}</div>
          <div>Hours Logged: ${c.hoursLogged} hrs</div>
          <div>Issue Date: ${new Date(c.issueDate).toLocaleDateString()}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {}
}

function initForms() {
  const formLog = document.getElementById('formLogHours');
  if (formLog) {
    formLog.addEventListener('submit', async (e) => {
      e.preventDefault();
      const event = document.getElementById('logEventSelect').value;
      const hours = parseFloat(document.getElementById('logHoursInput').value);
      const description = document.getElementById('logDescInput').value;

      try {
        const res = await fetch(`${API_BASE}/api/hours`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ event, hours, description })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Log hours failed');

        showToast('Service hours logged!', 'Success');
        formLog.reset();
        fetchHours();
        fetchBadges();
        fetchImpactStats();
      } catch (err) {
        showToast(err.message, 'Error', true);
      }
    });
  }

  const formCreate = document.getElementById('formCreateEvent');
  if (formCreate) {
    formCreate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDesc').value,
        location: document.getElementById('eventLocation').value,
        date: document.getElementById('eventDate').value,
        capacity: parseInt(document.getElementById('eventCapacity').value),
        volunteersNeeded: parseInt(document.getElementById('eventNeeded').value)
      };

      try {
        const res = await fetch(`${API_BASE}/api/events`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create event');

        showToast(`Created event "${data.event ? data.event.title : 'New Event'}"!`, 'Success');
        formCreate.reset();
        fetchEvents();
        fetchImpactStats();
      } catch (err) {
        showToast(err.message, 'Admin Error', true);
      }
    });
  }

  const formCert = document.getElementById('formIssueCert');
  if (formCert) {
    formCert.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        userId: document.getElementById('certUserId').value,
        title: document.getElementById('certTitle').value,
        hoursLogged: parseInt(document.getElementById('certHours').value)
      };

      try {
        const res = await fetch(`${API_BASE}/api/certificates`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to issue certificate');

        showToast(`Issued certificate #${data.certificate ? data.certificate.certificateNumber : ''}!`, 'Success');
        formCert.reset();
      } catch (err) {
        showToast(err.message, 'Admin Error', true);
      }
    });
  }
}

const btnVol = document.getElementById('btnSwitchVolunteer');
const btnAdmin = document.getElementById('btnSwitchAdmin');
const btnRef = document.getElementById('btnRefreshEvents');

if (btnVol) btnVol.addEventListener('click', () => autoLoginVolunteer());
if (btnAdmin) btnAdmin.addEventListener('click', () => autoLoginAdmin());
if (btnRef) btnRef.addEventListener('click', () => fetchEvents());

async function autoLoginVolunteer() {
  try {
    let res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane.volunteer@example.com', password: 'password123' })
    });
    if (!res.ok) {
      res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane Volunteer', email: 'jane.volunteer@example.com', password: 'password123', role: 'volunteer' })
      });
    }
    const data = await res.json();
    if (data.token) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('volunnet_token', authToken);
      localStorage.setItem('volunnet_user', JSON.stringify(currentUser));
      updateRoleBadge();
      refreshData();
    }
  } catch (err) {}
}

async function autoLoginAdmin() {
  try {
    let res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@volunnet.org', password: 'admin123456' })
    });
    if (!res.ok) {
      res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Admin Supervisor', email: 'admin@volunnet.org', password: 'admin123456', role: 'admin' })
      });
    }
    const data = await res.json();
    if (data.token) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('volunnet_token', authToken);
      localStorage.setItem('volunnet_user', JSON.stringify(currentUser));
      updateRoleBadge();
      showToast('Logged in as Administrator.', 'Admin Mode');
      refreshData();
    }
  } catch (err) {}
}

function initAuthModal() {
  const modal = document.getElementById('authModal');
  const btnOpen = document.getElementById('btnOpenAuth');
  const btnClose = document.getElementById('btnCloseAuth');
  const formAuth = document.getElementById('formAuth');

  if (btnOpen && modal) btnOpen.addEventListener('click', () => modal.style.display = 'flex');
  if (btnClose && modal) btnClose.addEventListener('click', () => modal.style.display = 'none');

  if (formAuth) {
    formAuth.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Auth failed');

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('volunnet_token', authToken);
        localStorage.setItem('volunnet_user', JSON.stringify(currentUser));
        if (modal) modal.style.display = 'none';
        updateRoleBadge();
        showToast(`Logged in as ${currentUser.name}`, 'Success');
        refreshData();
      } catch (err) {
        showToast(err.message, 'Error', true);
      }
    });
  }
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
}
