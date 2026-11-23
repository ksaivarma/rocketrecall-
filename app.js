
const KEY = "recallrocket_big_v1";

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

const starter = () => ({
  decks: [
    {
      id: "alg",
      name: "Algorithms",
      description: "Core computer science concepts",
      cards: [
        makeCard(
          "What is the average time complexity of QuickSort?",
          "O(n log n). Its worst case is O(n²), but its average case is O(n log n)."
        ),
        makeCard(
          "What is a queue?",
          "A linear data structure that follows FIFO: First In, First Out."
        ),
        makeCard(
          "What is the time complexity of binary search?",
          "O(log n), because the search space is halved at each step. The data must be sorted."
        )
      ]
    },
    {
      id: "web",
      name: "Web Development",
      description: "HTML, CSS and JavaScript essentials",
      cards: [
        makeCard(
          "What does HTML stand for?",
          "HyperText Markup Language. It structures the content of web pages."
        ),
        makeCard(
          "What is CSS used for?",
          "CSS styles web pages, including layout, colors, spacing and typography."
        )
      ]
    },
    {
      id: "net",
      name: "Computer Networks",
      description: "Networking fundamentals",
      cards: [
        makeCard(
          "What does IP stand for?",
          "Internet Protocol. It provides addressing and routing for network communication."
        ),
        makeCard(
          "What is DNS?",
          "Domain Name System. It translates domain names into IP addresses."
        )
      ]
    }
  ],
  stats: {
    reviews: 0,
    points: 0,
    dates: [],
    daily: {},
    weekly: {}
  }
});

function makeCard(q, a) {
  return {
    id: uid(),
    q,
    a,
    ef: 2.5,
    interval: 0,
    reps: 0,
    due: today(),
    reviews: 0
  };
}

let data;

try {
  data = JSON.parse(localStorage.getItem(KEY)) || starter();
} catch {
  data = starter();
}

let active = null;

const $ = s => document.querySelector(s);

const all = () =>
  data.decks.flatMap((d, di) =>
    d.cards.map(c => ({
      ...c,
      deckId: d.id,
      deckName: d.name,
      deckIndex: di
    }))
  );

const due = () =>
  all().filter(c => c.due <= today());

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function safe(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// STUDY STREAK

function streak() {
  let dates = [...new Set(data.stats.dates)].sort().reverse();
  let n = 0;
  let cur = new Date(today() + "T00:00:00Z");

  if (dates[0] !== today()) {
    cur.setUTCDate(cur.getUTCDate() - 1);

    if (dates[0] !== cur.toISOString().slice(0, 10))
      return 0;
  }

  for (const d of dates) {
    if (d === cur.toISOString().slice(0, 10)) {
      n++;
      cur.setUTCDate(cur.getUTCDate() - 1);
    } else if (d < cur.toISOString().slice(0, 10)) {
      break;
    }
  }

  return n;
}

// DASHBOARD STATISTICS

function renderStats() {
  const d = due().length;
  const s = streak();
  const r = data.stats.reviews;
  const p = data.stats.points;

  $("#dueStat").textContent = d;
  $("#streakStat").textContent = s + " days";
  $("#reviewStat").textContent = r;
  $("#pointsStat").textContent = p;

  $("#streakValue").textContent = s;
  $("#duePill").textContent = d + " waiting";

  $("#dueBar").style.width = Math.min(100, d * 12) + "%";
  $("#streakBar").style.width = Math.min(100, s * 10) + "%";
  $("#reviewBar").style.width = Math.min(100, r) + "%";
  $("#pointsBar").style.width = Math.min(100, p / 10) + "%";

  $("#focusTitle").textContent = d
    ? `${d} cards are ready for review`
    : "Your next breakthrough starts here";

  $("#focusText").textContent = d
    ? "Take a few minutes to review your due flashcards and strengthen your memory."
    : "You have no cards waiting. Add flashcards to start building your memory.";

  $("#studyCount").textContent = d + " cards due";

  $("#weekTotal").textContent =
    Object.values(data.stats.weekly).reduce((a, b) => a + b, 0) +
    " reviews this week";

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    let dt = new Date(now);
    dt.setDate(now.getDate() - i);

    let key = dt.toISOString().slice(0, 10);

    days.push({
      key,
      label: labels[dt.getDay()],
      value: data.stats.weekly[key] || 0
    });
  }

  let max = Math.max(1, ...days.map(x => x.value));

  $("#weekChart").innerHTML = days.map(x => `
    <div class="day-col">
      <div class="bar-track">
        <div class="bar-fill"
          style="height:${Math.max(4, x.value / max * 100)}%">
        </div>
      </div>
      <small>${x.label}</small>
    </div>
  `).join("");
}

// DECK MANAGEMENT

function renderDecks() {
  const cards = data.decks.map((d, i) => `
    <article class="deck-card">
      <div class="deck-symbol">
        ${["⌘", "✧", "◈", "▣"][i % 4]}
      </div>

      <h3>${safe(d.name)}</h3>

      <p>${safe(d.description || "Your personal study deck")}</p>

      <div class="deck-meta">
        <span>${d.cards.length} cards</span>
        <span>${d.cards.filter(c => c.due <= today()).length} due today</span>
      </div>

      <div class="deck-actions">
        <button class="secondary-btn" data-add="${d.id}">
          ＋ Add card
        </button>

        <button class="primary-btn" data-study="${d.id}">
          Study →
        </button>
      </div>
    </article>
  `).join("");

  $("#deckGrid").innerHTML = cards ||
    '<div class="empty-panel"><h2>No decks yet</h2><p>Create your first deck to get started.</p></div>';

  $("#previewDecks").innerHTML = data.decks.slice(0, 3).map((d, i) => `
    <article class="preview-card">
      <div class="deck-symbol">${["⌘", "✧", "◈"][i]}</div>
      <h3>${safe(d.name)}</h3>
      <p>${d.cards.length} flashcards · ${d.cards.filter(c => c.due <= today()).length} due</p>
      <button data-study="${d.id}">Open deck →</button>
    </article>
  `).join("");
}

// LEADERBOARD

function renderLeaderboard() {
  const people = [
    {
      name: "Aarav Sharma",
      reviews: 126,
      streak: 12,
      points: 610
    },
    {
      name: "Priya Reddy",
      reviews: 98,
      streak: 9,
      points: 520
    },
    {
      name: "You",
      reviews: data.stats.reviews,
      streak: streak(),
      points: data.stats.points
    },
    {
      name: "Rahul Kumar",
      reviews: 65,
      streak: 5,
      points: 330
    }
  ].sort((a, b) => b.points - a.points);

  $("#leaderboardRows").innerHTML = people.map((p, i) => `
    <tr class="${p.name === "You" ? "you-row" : ""}">
      <td>#${i + 1}</td>
      <td>${safe(p.name)} ${p.name === "You" ? "(you)" : ""}</td>
      <td>${p.reviews}</td>
      <td>🔥 ${p.streak} days</td>
      <td><b>${p.points}</b></td>
    </tr>
  `).join("");
}

// PAGE NAVIGATION

function showPage(name) {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.add("hidden")
  );

  $("#" + name + "Page").classList.remove("hidden");

  document.querySelectorAll(".side-link[data-page]").forEach(b =>
    b.classList.toggle("active", b.dataset.page === name)
  );

  $("#pageTitle").textContent = ({
    dashboard: "Your learning dashboard",
    study: "Your study session",
    decks: "Your flashcard library",
    leaderboard: "Learning leaderboard"
  })[name];

  if (name === "study") loadCard();
  if (name === "dashboard") renderStats();
}

// FLASHCARD LOADING

function loadCard() {
  const list = due().filter(c =>
    !active || c.deckId === active.deckId
  );

  if (!list.length) {
    active = null;

    $("#flashcard").classList.add("hidden");
    $("#studyEmpty").classList.remove("hidden");
    $("#studyCount").textContent = "0 cards due";

    return;
  }

  active = list[0];

  $("#studyEmpty").classList.add("hidden");
  $("#flashcard").classList.remove("hidden");
  $("#flashcard").classList.remove("flipped");

  $("#questionText").textContent = active.q;
  $("#answerText").textContent = active.a;
  $("#cardDeck").textContent = active.deckName;

  $("#cardNumber").textContent =
    String(active.reviews + 1).padStart(2, "0");

  $("#scheduleMessage").textContent =
    "Flip the card to reveal the answer.";
}

// FLIP FLASHCARD

function flip() {
  if (active)
    $("#flashcard").classList.toggle("flipped");
}

// SM-2 SPACED REPETITION ALGORITHM

function rate(grade) {
  if (!active) return;

  if (!$("#flashcard").classList.contains("flipped")) {
    $("#scheduleMessage").textContent =
      "Flip the card before rating your recall.";
    return;
  }

  const d = data.decks.find(x => x.id === active.deckId);
  const c = d.cards.find(x => x.id === active.id);

  if (grade < 3) {
    c.reps = 0;
    c.interval = 1;
  } else {
    c.interval = c.reps === 0
      ? 1
      : c.reps === 1
        ? 6
        : Math.round(c.interval * c.ef);

    c.reps++;
  }

  const diff = 5 - grade;

  c.ef = Math.max(
    1.3,
    c.ef + (0.1 - diff * (0.08 + diff * 0.02))
  );

  const next = new Date();

  next.setDate(next.getDate() + c.interval);

  c.due = next.toISOString().slice(0, 10);
  c.reviews++;

  data.stats.reviews++;
  data.stats.points += grade * 10;

  data.stats.daily[today()] =
    (data.stats.daily[today()] || 0) + 1;

  data.stats.weekly[today()] =
    (data.stats.weekly[today()] || 0) + 1;

  if (!data.stats.dates.includes(today()))
    data.stats.dates.push(today());

  save();

  active = null;

  renderAll();
  loadCard();
}

// OPEN ADD CARD FORM

function openCard(deckId) {
  $("#targetDeck").value = deckId;
  $("#cardDialog").showModal();
}

// RENDER EVERYTHING

function renderAll() {
  renderStats();
  renderDecks();
  renderLeaderboard();
}

// NAVIGATION EVENTS

document.querySelectorAll("[data-page]").forEach(b =>
  b.addEventListener("click", () => showPage(b.dataset.page))
);

document.querySelectorAll("[data-open]").forEach(b =>
  b.addEventListener("click", () => showPage(b.dataset.open))
);

$("#startFromSide").onclick = () => showPage("study");

// QUICK ADD BUTTON

$("#quickAdd").onclick = () => {
  if (!data.decks.length) {
    showPage("decks");
    return;
  }

  openCard(data.decks[0].id);
};

// CREATE DECK

$("#newDeckBtn").onclick = () =>
  $("#deckDialog").showModal();

document.querySelectorAll("[data-close]").forEach(b =>
  b.onclick = () => $("#" + b.dataset.close).close()
);

$("#deckForm").addEventListener("submit", e => {
  e.preventDefault();

  let name = $("#deckName").value.trim();

  if (!name) return;

  data.decks.push({
    id: uid(),
    name,
    description: $("#deckDescription").value.trim(),
    cards: []
  });

  save();

  e.target.reset();
  $("#deckDialog").close();

  renderAll();
});

// ADD FLASHCARD

$("#cardForm").addEventListener("submit", e => {
  e.preventDefault();

  let d = data.decks.find(
    x => x.id === $("#targetDeck").value
  );

  if (!d) return;

  d.cards.push(
    makeCard(
      $("#newQuestion").value.trim(),
      $("#newAnswer").value.trim()
    )
  );

  save();

  e.target.reset();
  $("#cardDialog").close();

  renderAll();

  if (!$("#studyPage").classList.contains("hidden"))
    loadCard();
});

// DECK BUTTON EVENTS

document.addEventListener("click", e => {
  let a = e.target.closest("[data-add]");
  let s = e.target.closest("[data-study]");

  if (a)
    openCard(a.dataset.add);

  if (s) {
    active = { deckId: s.dataset.study };
    showPage("study");
    loadCard();
  }
});

// FLASHCARD AND RATING EVENTS

$("#flashcard").onclick = flip;

document.querySelectorAll("[data-grade]").forEach(b =>
  b.onclick = () => rate(Number(b.dataset.grade))
);

// KEYBOARD SHORTCUTS

document.addEventListener("keydown", e => {
  if (e.target.matches("input,textarea")) return;

  if (
    e.code === "Space" &&
    !$("#studyPage").classList.contains("hidden")
  ) {
    e.preventDefault();
    flip();
  }

  if (
    /^[0-5]$/.test(e.key) &&
    !$("#studyPage").classList.contains("hidden")
  ) {
    rate(+e.key);
  }
});

// DARK MODE

$("#themeBtn").onclick = () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "rr_theme",
    document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );
};

// CSV EXPORT

function csvEscape(v) {
  return '"' + String(v).replace(/"/g, '""') + '"';
}

$("#exportBtn").onclick = () => {
  let rows = [
    ["deck", "question", "answer"],
    ...data.decks.flatMap(d =>
      d.cards.map(c => [d.name, c.q, c.a])
    )
  ];

  let csv = rows
    .map(r => r.map(csvEscape).join(","))
    .join("\n");

  let a = document.createElement("a");

  a.href = URL.createObjectURL(
    new Blob([csv], { type: "text/csv" })
  );

  a.download = "recallrocket-flashcards.csv";
  a.click();

  URL.revokeObjectURL(a.href);
};

// CSV IMPORT

$("#importFile").onchange = async e => {
  let f = e.target.files[0];

  if (!f) return;

  let lines = (await f.text())
    .split(/\r?\n/)
    .slice(1);

  let count = 0;

  for (let line of lines) {
    let m = line.match(
      /(?:^|,)("(?:[^"]|"")*"|[^,]*)/g
    );

    if (!m || m.length < 3) continue;

    let vals = m.map(x =>
      x.replace(/^,/, "")
       .replace(/^"|"$/g, "")
       .replace(/""/g, '"')
    );

    let [name, q, a] = vals;

    if (!q || !a) continue;

    let d = data.decks.find(x => x.name === name);

    if (!d) {
      d = {
        id: uid(),
        name: name || "Imported deck",
        description: "Imported flashcards",
        cards: []
      };

      data.decks.push(d);
    }

    d.cards.push(makeCard(q, a));
    count++;
  }

  save();
  renderAll();

  alert("Imported " + count + " flashcards.");

  e.target.value = "";
};

// LOAD SAVED THEME

if (localStorage.getItem("rr_theme") === "dark")
  document.body.classList.add("dark");

// INITIALIZE APPLICATION

renderAll();
loadCard();


// ===== LOGIN SYSTEM =====

const loginOverlay = document.getElementById("loginOverlay");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginPassword = document.getElementById("loginPassword");
const togglePassword = document.getElementById("togglePassword");
const logoutBtn = document.getElementById("logoutBtn");

function updateLoginScreen() {
  const savedEmail = localStorage.getItem("rr_user_email");

  if (savedEmail) {
    loginOverlay.classList.add("hidden");

    const profileName = document.querySelector(".profile b");
    const avatar = document.querySelector(".avatar");

    if (profileName) {
      profileName.textContent = savedEmail.split("@")[0];
    }

    if (avatar) {
      avatar.textContent = savedEmail.charAt(0).toUpperCase();
    }
  } else {
    loginOverlay.classList.remove("hidden");
  }
}

// Show or hide password
togglePassword.addEventListener("click", () => {
  if (loginPassword.type === "password") {
    loginPassword.type = "text";
    togglePassword.textContent = "Hide";
  } else {
    loginPassword.type = "password";
    togglePassword.textContent = "Show";
  }
});

// Login form
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = loginPassword.value;

  if (!email || password.length < 4) {
    loginError.textContent = "Please enter a valid email and password.";
    return;
  }

  // Demo login: stores the email in this browser
  localStorage.setItem("rr_user_email", email);

  loginError.textContent = "";
  loginForm.reset();
  loginPassword.type = "password";
  togglePassword.textContent = "Show";

  updateLoginScreen();
});

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("rr_user_email");
  updateLoginScreen();
});

// Check login when the page opens
updateLoginScreen();

// ===== END LOGIN SYSTEM =====



