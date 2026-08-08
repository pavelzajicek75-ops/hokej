const API_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('hokej_user')) || null;

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  loadStats();
  loadMatches();

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        currentUser = data.user;
        localStorage.setItem('hokej_user', JSON.stringify(currentUser));
        setupUI();
        loadMatches();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Chyba při přihlášení!');
    }
  });

  document.getElementById('auth-btn').addEventListener('click', () => {
    if (currentUser) {
      currentUser = null;
      localStorage.removeItem('hokej_user');
      setupUI();
      loadMatches();
    }
  });

  document.getElementById('admin-match-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      date: document.getElementById('date').value,
      stadium: document.getElementById('stadium').value,
      blue_score: parseInt(document.getElementById('blue-score').value),
      yellow_score: parseInt(document.getElementById('yellow-score').value),
      note: document.getElementById('note').value
    };

    const res = await fetch(`${API_URL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': currentUser.username
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('blue-score').value = '';
      document.getElementById('yellow-score').value = '';
      document.getElementById('note').value = '';
      loadMatches();
      loadStats();
    } else {
      alert('Nejste oprávněni přidat zápas!');
    }
  });
});

function setupUI() {
  const userDisplay = document.getElementById('user-display');
  const authBtn = document.getElementById('auth-btn');
  const loginCard = document.getElementById('login-card');
  const adminFormCard = document.getElementById('admin-match-form-card');

  if (currentUser) {
    userDisplay.textContent = `👤 ${currentUser.username} (${currentUser.role.toUpperCase()})`;
    authBtn.textContent = 'Odhlásit';
    loginCard.classList.add('hidden');

    if (currentUser.role === 'admin') {
      adminFormCard.classList.remove('hidden');
    } else {
      adminFormCard.classList.add('hidden');
    }
  } else {
    userDisplay.textContent = 'Odhlášen';
    authBtn.textContent = 'Přihlásit se';
    loginCard.classList.remove('hidden');
    adminFormCard.classList.add('hidden');
  }
}

async function loadMatches() {
  try {
    const res = await fetch(`${API_URL}/matches`);
    const matches = await res.json();
    const container = document.getElementById('matches-container');
    container.innerHTML = '';

    if (matches.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:1rem;">Zatím žádné zápasy. Sazeno na led! 🏒</p>';
      return;
    }

    for (const match of matches) {
      const matchEl = document.createElement('div');
      matchEl.className = 'match-item';

      const commentsRes = await fetch(`${API_URL}/matches/${match.id}/comments`);
      const comments = await commentsRes.json();

      let commentsHTML = comments.map(c => `
        <div class="comment-box">
          <span class="comment-author">${c.author}:</span> ${c.text}
        </div>
      `).join('');

      const commentFormHTML = currentUser ? `
        <form class="add-comment-form" onsubmit="postComment(event, ${match.id})">
          <input type="text" placeholder="Napiš komentář..." required />
          <button type="submit" class="btn-sm">Odeslat</button>
        </form>
      ` : '<p style="font-size:0.8rem; color:#666; margin-top:0.5rem;">Pro komentování se přihlaš vpravo.</p>';

      const deleteBtnHTML = (currentUser && currentUser.role === 'admin') ? 
        `<button class="btn-danger" onclick="deleteMatch(${match.id})">Smazat zápas</button>` : '';

      matchEl.innerHTML = `
        <div class="match-header">
          <strong>${match.date} (${match.stadium})</strong>
          ${deleteBtnHTML}
        </div>
        <div class="match-score">🟦 ${match.blue_score} : ${match.yellow_score} 🟨</div>
        <p><em>${match.note || ''}</em></p>
        
        <div class="comments-section">
          <strong>Komentáře z kabiny (${comments.length}):</strong>
          ${commentsHTML}
          ${commentFormHTML}
        </div>
      `;

      container.appendChild(matchEl);
    }
  } catch (err) {
    console.error('Chyba načítání:', err);
  }
}

async function postComment(e, matchId) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const text = input.value;

  const res = await fetch(`${API_URL}/matches/${matchId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Name': currentUser.username
    },
    body: JSON.stringify({ text })
  });

  if (res.ok) {
    input.value = '';
    loadMatches();
  } else {
    alert('Chyba při odesílání komentáře');
  }
}

async function deleteMatch(id) {
  if (!confirm('Opravdu smazat zápas?')) return;
  await fetch(`${API_URL}/matches/${id}`, {
    method: 'DELETE',
    headers: { 'X-User-Name': currentUser.username }
  });
  loadMatches();
  loadStats();
}

async function loadStats() {
  try {
    const res = await fetch(`${API_URL}/stats`);
    const stats = await res.json();
    document.getElementById('blue-wins').textContent = stats.blue_wins;
    document.getElementById('yellow-wins').textContent = stats.yellow_wins;
  } catch (err) {
    console.error(err);
  }
}
