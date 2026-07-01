let languageChart = null;

// ── RATE LIMIT ──

async function updateRateLimit() {
  try {
    const token = localStorage.getItem("gh_token") || "";
    const headers = token ? { Authorization: `token ${token}` } : {};
    const res = await fetch("https://api.github.com/rate_limit", { headers });
    const data = await res.json();
    const { remaining, limit, reset } = data.rate;
    const resetTime = new Date(reset * 1000).toLocaleTimeString();
    const pct = Math.round((remaining / limit) * 100);
    const color = remaining > 30 ? "#3fb950" : remaining > 10 ? "#e3b341" : "#f85149";
    document.querySelector("#rate-bar-fill").style.width = pct + "%";
    document.querySelector("#rate-bar-fill").style.background = color;
    document.querySelector("#rate-text").textContent = `API: ${remaining}/${limit} — resets ${resetTime}`;
  } catch {}
}

// ── TOKEN ──

function saveToken() {
  const val = document.querySelector("#token-input").value.trim();
  if (val) {
    localStorage.setItem("gh_token", val);
    document.querySelector("#token-status").textContent = "✅ Token saved";
    document.querySelector("#token-status").style.color = "#3fb950";
  } else {
    localStorage.removeItem("gh_token");
    document.querySelector("#token-status").textContent = "🗑 Token removed";
    document.querySelector("#token-status").style.color = "#f85149";
  }
  setTimeout(() => { document.querySelector("#token-status").textContent = ""; }, 2500);
  updateRateLimit();
}

function authHeaders() {
  const token = localStorage.getItem("gh_token") || "";
  return token ? { Authorization: `token ${token}` } : {};
}

// ── HISTORY ──

function showHistory() {
  let searches = JSON.parse(localStorage.getItem("searches")) || [];
  let output = "";
  searches.slice().reverse().forEach(user => {
    output += `
    <li class="history-item">
      <button onclick="searchUser('${user}')">${user}</button>
      <span onclick="deleteHistory('${user}')">❌</span>
    </li>`;
  });
  if (!output) output = `<li style="color:#8b949e;padding:8px 16px;font-size:13px;">No recent searches</li>`;
  document.querySelector("#history").innerHTML = output;
}

function saveSearch(username) {
  let searches = JSON.parse(localStorage.getItem("searches")) || [];
  searches = searches.filter(u => u !== username);
  searches.push(username);
  if (searches.length > 10) searches.shift();
  localStorage.setItem("searches", JSON.stringify(searches));
}

function deleteHistory(username) {
  let searches = JSON.parse(localStorage.getItem("searches")) || [];
  searches = searches.filter(user => user !== username);
  localStorage.setItem("searches", JSON.stringify(searches));
  showHistory();
}

function clearHistory() {
  localStorage.removeItem("searches");
  showHistory();
  document.querySelector("#history-container").classList.remove("show");
}

function searchUser(username) {
  document.querySelector("#username").value = username;
  closeAllDropdowns();
  loadUser(username);
}

// ── FAVORITES ──

function toggleFavorite(username) {
  let fav = JSON.parse(localStorage.getItem("favorites")) || [];
  const btn = document.querySelector("#fav-star-btn");
  if (fav.includes(username)) {
    fav = fav.filter(u => u !== username);
    localStorage.setItem("favorites", JSON.stringify(fav));
    if (btn) { btn.textContent = "☆ Add to Favorites"; btn.style.color = "#e3b341"; btn.style.background = "transparent"; }
  } else {
    fav.push(username);
    localStorage.setItem("favorites", JSON.stringify(fav));
    if (btn) { btn.textContent = "★ Favorited"; btn.style.color = "#0d1117"; btn.style.background = "#e3b341"; }
  }
}

function removeFavorite(username) {
  let fav = JSON.parse(localStorage.getItem("favorites")) || [];
  fav = fav.filter(u => u !== username);
  localStorage.setItem("favorites", JSON.stringify(fav));
  renderFavorites();
}

function renderFavorites() {
  let fav = JSON.parse(localStorage.getItem("favorites")) || [];
  const list = document.querySelector("#favorites-list");
  if (!list) return;
  if (fav.length === 0) {
    list.innerHTML = `<li style="color:#8b949e;padding:8px 16px;font-size:13px;">No favorites yet. Click ⭐ on a profile to save.</li>`;
  } else {
    list.innerHTML = fav.slice().reverse().map(user => `
      <li class="history-item">
        <button onclick="searchUser('${user}')">⭐ ${user}</button>
        <span onclick="removeFavorite('${user}')">❌</span>
      </li>`).join("");
  }
}

function showFavorites(e) {
  e.stopPropagation();
  const favContainer = document.querySelector("#favorites-container");
  const isOpen = favContainer.classList.contains("show");
  closeAllDropdowns();
  if (!isOpen) {
    renderFavorites();
    favContainer.classList.add("show");
  }
}

// ── HELPERS ──

function closeAllDropdowns() {
  document.querySelector("#history-container").classList.remove("show");
  document.querySelector("#favorites-container").classList.remove("show");
  document.querySelector("#token-panel").classList.remove("show");
}

function animateCount(el, target) {
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ── SHARE ──

function shareProfile(username) {
  const url = `${location.origin}${location.pathname}?user=${username}`;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector("#share-btn");
    if (!btn) return;
    btn.textContent = "✅ Copied!";
    setTimeout(() => btn.textContent = "🔗 Share", 2000);
  });
}

// ── SKELETON LOADING ──

function showSkeleton() {
  document.querySelector("#profile").innerHTML = `
    <div class="skeleton-card">
      <div class="skel skel-avatar"></div>
      <div class="skel skel-line w60"></div>
      <div class="skel skel-line w40"></div>
      <div class="skel skel-line w80"></div>
      <div class="skel skel-line w50"></div>
      <div class="skel skel-line w70"></div>
    </div>`;
  document.querySelector("#pinned").innerHTML = `
    <div class="skel skel-line w40" style="margin-bottom:14px;height:20px;"></div>
    <div class="pinned-grid">
      ${Array(4).fill(`<div class="skel" style="height:100px;border-radius:8px;"></div>`).join("")}
    </div>`;
  document.querySelector("#repos").innerHTML = "";
}

// ── NAVIGATION ──

function heroSearch(username) {
  document.querySelector("#hero-username").value = username;
  loadUser(username);
}

function showHero() {
  document.querySelector("#hero").style.display = "flex";
  document.querySelector("#profile-page").style.display = "none";
  history.pushState(null, "", location.pathname);
}

function showProfilePage() {
  document.querySelector("#hero").style.display = "none";
  document.querySelector("#profile-page").style.display = "block";
}

// ── REAL PINNED REPOS via GraphQL ──

async function fetchPinnedRepos(username) {
  const token = localStorage.getItem("gh_token") || "";
  if (!token) return null; // GraphQL requires auth
  const query = `{
    user(login: "${username}") {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            forks { totalCount }
            primaryLanguage { name }
          }
        }
      }
    }
  }`;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    return json?.data?.user?.pinnedItems?.nodes || null;
  } catch { return null; }
}

// ── CONTRIBUTION CALENDAR ──

async function fetchContributions(username) {
  const token = localStorage.getItem("gh_token") || "";
  if (!token) return null;
  const query = `{
    user(login: "${username}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }`;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    return json?.data?.user?.contributionsCollection?.contributionCalendar || null;
  } catch { return null; }
}

function renderCalendar(cal) {
  if (!cal) return "";
  const { totalContributions, weeks } = cal;
  const days = weeks.flatMap(w => w.contributionDays);
  const max = Math.max(...days.map(d => d.contributionCount), 1);

  const cells = days.map(d => {
    const pct = d.contributionCount / max;
    const level = pct === 0 ? 0 : pct < 0.25 ? 1 : pct < 0.5 ? 2 : pct < 0.75 ? 3 : 4;
    return `<div class="cal-cell level-${level}" title="${d.date}: ${d.contributionCount} contributions"></div>`;
  }).join("");

  return `
    <div id="contribution-section">
      <h2 class="section-title">🌿 Contributions <span class="contrib-total">${totalContributions.toLocaleString()} this year</span></h2>
      <div class="cal-grid">${cells}</div>
    </div>`;
}

// ── MAIN LOAD ──

async function loadUser(username) {
  username = username.trim();
  if (!username) return;

  history.pushState(null, "", `?user=${username}`);
  showProfilePage();
  showSkeleton();
  document.querySelector("#pinned").innerHTML = "";
  document.querySelector("#repos").innerHTML = "";
  document.querySelector("#username").value = username;
  document.querySelector("#hero-username").value = username;

  try {
    const [userRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers: authHeaders() }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: authHeaders() })
    ]);

    if (!userRes.ok) {
      if (userRes.status === 404) throw new Error(`User "${username}" not found on GitHub`);
      if (userRes.status === 403) throw new Error("API rate limit reached. Add a token to continue.");
      throw new Error("GitHub API error. Try again shortly.");
    }

    const data = await userRes.json();
    let repos = await repoRes.json();
    if (!Array.isArray(repos)) repos = [];

    const isFav = (JSON.parse(localStorage.getItem("favorites")) || []).includes(data.login);

    // Profile card
    document.querySelector("#profile").innerHTML = `
      <div class="profile-card">
        <img class="avatar" src="${data.avatar_url}" alt="${data.login}">
        <h2>${data.name || data.login}</h2>
        <p class="login">@${data.login}</p>
        ${data.bio ? `<p class="bio">${data.bio}</p>` : ""}
        <div class="profile-info">
          ${data.location ? `<p>🌍 ${data.location}</p>` : ""}
          ${data.company ? `<p>🏢 ${data.company}</p>` : ""}
          ${data.blog ? `<p>🔗 <a href="${data.blog}" target="_blank">${data.blog.replace(/^https?:\/\//, "")}</a></p>` : ""}
          ${data.twitter_username ? `<p>🐦 <a href="https://twitter.com/${data.twitter_username}" target="_blank">@${data.twitter_username}</a></p>` : ""}
          <p>📅 Joined ${new Date(data.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-num" id="s-followers">0</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-box">
            <span class="stat-num" id="s-following">0</span>
            <span class="stat-label">Following</span>
          </div>
          <div class="stat-box">
            <span class="stat-num" id="s-repos">0</span>
            <span class="stat-label">Repos</span>
          </div>
          <div class="stat-box">
            <span class="stat-num" id="s-gists">0</span>
            <span class="stat-label">Gists</span>
          </div>
        </div>
        <a class="github-btn" href="${data.html_url}" target="_blank">Open on GitHub ↗</a>
        <button id="share-btn" onclick="shareProfile('${data.login}')" class="share-btn">🔗 Share</button>
        <button id="fav-star-btn" onclick="toggleFavorite('${data.login}')" class="fav-btn" style="
          background:${isFav ? "#e3b341" : "transparent"};
          color:${isFav ? "#0d1117" : "#e3b341"};
        ">${isFav ? "★ Favorited" : "☆ Add to Favorites"}</button>
      </div>`;

    // Animate stat counters
    animateCount(document.querySelector("#s-followers"), data.followers);
    animateCount(document.querySelector("#s-following"), data.following);
    animateCount(document.querySelector("#s-repos"), data.public_repos);
    animateCount(document.querySelector("#s-gists"), data.public_gists);

    saveSearch(username);
    showHistory();
    updateRateLimit();

    // Language chart
    let langMap = {};
    repos.forEach(r => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1; });
    const isDark = document.body.classList.contains("dark");
    const ctx = document.getElementById("langChart");
    if (ctx) {
      if (languageChart) languageChart.destroy();
      if (Object.keys(langMap).length > 0) {
        const COLORS = ["#58a6ff","#3fb950","#e3b341","#f85149","#bc8cff","#ff7b72","#79c0ff","#56d364","#ffa657","#f778ba","#4ac26b","#d2a8ff","#ff9492","#a5d6ff","#ace958"];
        const labels = Object.keys(langMap);
        const chartColors = labels.map((_,i) => COLORS[i % COLORS.length]);
        languageChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels,
            datasets: [{
              data: Object.values(langMap),
              backgroundColor: chartColors,
              borderWidth: 2,
              borderColor: isDark ? "#0d1117" : "#ffffff"
            }]
          },
          options: {
            responsive: true,
            animation: { animateRotate: true, duration: 800 },
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: isDark ? "#e6edf3" : "#1f2328",
                  padding: 16,
                  font: { size: 13 }
                }
              },
              tooltip: {
                callbacks: { label: c => ` ${c.label}: ${c.parsed} repos` }
              }
            }
          }
        });
      }
    }

    // Pinned repos — real GraphQL if token, else top-starred fallback
    const pinned = await fetchPinnedRepos(username);
    const pinnedSource = pinned && pinned.length > 0 ? pinned : null;
    const fallback = [...repos].filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);

    const pinnedLabel = pinnedSource ? "📌 Pinned" : "⭐ Top Repositories";
    const pinnedItems = pinnedSource
      ? pinnedSource.map(r => ({
          name: r.name, desc: r.description, url: r.url,
          stars: r.stargazerCount, forks: r.forks?.totalCount || 0, lang: r.primaryLanguage?.name || "Unknown"
        }))
      : fallback.map(r => ({
          name: r.name, desc: r.description, url: r.html_url,
          stars: r.stargazers_count, forks: r.forks_count, lang: r.language || "Unknown"
        }));

    let pinnedHTML = `<h2 class="section-title">${pinnedLabel}${!pinnedSource ? ' <span class="tip-badge">Add token for real pins</span>' : ''}</h2><div class="pinned-grid">`;
    pinnedItems.forEach((r, i) => {
      pinnedHTML += `
        <a class="pinned-card" href="${r.url}" target="_blank" style="animation-delay:${i * 60}ms">
          <div class="pinned-top"><span>📁</span><span class="repo-name">${r.name}</span></div>
          <p class="repo-desc">${r.desc || "No description"}</p>
          <div class="repo-meta">
            <span>💻 ${r.lang}</span>
            <span>⭐ ${r.stars.toLocaleString()}</span>
            <span>🍴 ${r.forks.toLocaleString()}</span>
          </div>
        </a>`;
    });
    pinnedHTML += "</div>";
    document.querySelector("#pinned").innerHTML = pinnedHTML;

    // Contribution calendar
    const calData = await fetchContributions(username);
    const calHTML = renderCalendar(calData);
    document.querySelector("#calendar-section").innerHTML = calHTML ||
      (!localStorage.getItem("gh_token") ? `<p class="tip-text">🌿 Add a GitHub token to see the contribution calendar</p>` : "");

    renderRepoList(repos);

    // Scroll animations
    document.querySelectorAll(".pinned-card").forEach(el => el.classList.add("fade-in"));

  } catch (error) {
    document.querySelector("#profile").innerHTML = `
      <div class="error-card">
        <div class="error-icon">😕</div>
        <p class="error-title">${error.message}</p>
        <p class="error-sub">Check the username and try again</p>
        <button onclick="showHero()" class="error-back">← Back to Search</button>
      </div>`;
    document.querySelector("#pinned").innerHTML = "";
    document.querySelector("#repos").innerHTML = "";
  }
}

function renderRepoList(repos) {
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);

  let html = `
    <h2 class="section-title">📂 Repositories
      <span class="repo-summary">⭐ ${totalStars.toLocaleString()} total stars · 🍴 ${totalForks.toLocaleString()} total forks</span>
    </h2>
    <div class="repo-tools">
      <input id="repo-search" placeholder="🔍 Search repositories...">
      <select id="repo-sort">
        <option value="stars">⭐ Most Stars</option>
        <option value="forks">🍴 Most Forks</option>
        <option value="updated">🕒 Latest Updated</option>
        <option value="name">A–Z</option>
      </select>
      <label class="fork-toggle">
        <input type="checkbox" id="hide-forks"> Hide forks
      </label>
    </div>
    <div id="repo-list">`;

  repos.forEach(repo => {
    html += `
      <div class="repo" data-fork="${repo.fork}">
        <div class="repo-header">
          <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a>${repo.fork ? ' <span class="fork-badge">Fork</span>' : ''}</h3>
          <span class="repo-updated">Updated ${timeAgo(repo.updated_at)}</span>
        </div>
        <p>${repo.description || "No description"}</p>
        <div class="repo-details">
          <span>⭐ ${repo.stargazers_count.toLocaleString()}</span>
          <span>🍴 ${repo.forks_count.toLocaleString()}</span>
          <span>👁 ${repo.watchers_count.toLocaleString()}</span>
          ${repo.language ? `<span>💻 ${repo.language}</span>` : ""}
          ${repo.license ? `<span>📄 ${repo.license.spdx_id}</span>` : ""}
        </div>
      </div>`;
  });
  html += "</div>";
  document.querySelector("#repos").innerHTML = html;

  const repoSearch = document.querySelector("#repo-search");
  const repoSort = document.querySelector("#repo-sort");
  const hideForks = document.querySelector("#hide-forks");

  function filterAndRender() {
    const val = repoSearch.value.toLowerCase();
    const hideFork = hideForks.checked;
    document.querySelectorAll(".repo").forEach(r => {
      const matchText = r.innerText.toLowerCase().includes(val);
      const matchFork = hideFork ? r.dataset.fork === "false" : true;
      r.style.display = matchText && matchFork ? "block" : "none";
    });
  }

  repoSearch.onkeyup = filterAndRender;
  hideForks.onchange = filterAndRender;

  repoSort.onchange = function () {
    let sorted = [...repos];
    if (this.value === "stars")   sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
    if (this.value === "forks")   sorted.sort((a, b) => b.forks_count - a.forks_count);
    if (this.value === "updated") sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    if (this.value === "name")    sorted.sort((a, b) => a.name.localeCompare(b.name));
    const list = document.querySelector("#repo-list");
    list.innerHTML = "";
    sorted.forEach(repo => {
      list.innerHTML += `
        <div class="repo" data-fork="${repo.fork}">
          <div class="repo-header">
            <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a>${repo.fork ? ' <span class="fork-badge">Fork</span>' : ''}</h3>
            <span class="repo-updated">Updated ${timeAgo(repo.updated_at)}</span>
          </div>
          <p>${repo.description || "No description"}</p>
          <div class="repo-details">
            <span>⭐ ${repo.stargazers_count.toLocaleString()}</span>
            <span>🍴 ${repo.forks_count.toLocaleString()}</span>
            ${repo.language ? `<span>💻 ${repo.language}</span>` : ""}
          </div>
        </div>`;
    });
  };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ── EVENTS ──

document.addEventListener("DOMContentLoaded", () => {
  showHistory();
  updateRateLimit();

  // Pre-fill token input if saved
  const savedToken = localStorage.getItem("gh_token");
  if (savedToken) document.querySelector("#token-input").value = savedToken;

  document.querySelector("#favorites-btn").onclick = showFavorites;
  document.querySelector("#clear-history").onclick = clearHistory;
  document.querySelector("#clear-favorites").onclick = () => {
    localStorage.removeItem("favorites");
    renderFavorites();
  };
  document.querySelector("#save-token-btn").onclick = saveToken;

  document.querySelector("#token-btn").onclick = (e) => {
    e.stopPropagation();
    const panel = document.querySelector("#token-panel");
    const isOpen = panel.classList.contains("show");
    closeAllDropdowns();
    if (!isOpen) panel.classList.add("show");
  };

  const themeBtn = document.querySelector("#theme");
  themeBtn.onclick = () => {
    document.body.classList.toggle("dark");
    themeBtn.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️";
    if (languageChart) {
      languageChart.options.plugins.legend.labels.color = document.body.classList.contains("dark") ? "#e6edf3" : "#1f2328";
      languageChart.update();
    }
  };

  document.querySelector("#recent-btn").onclick = (e) => {
    e.stopPropagation();
    const histContainer = document.querySelector("#history-container");
    const isOpen = histContainer.classList.contains("show");
    closeAllDropdowns();
    if (!isOpen) { showHistory(); histContainer.classList.add("show"); }
  };

  document.addEventListener("click", closeAllDropdowns);
  document.querySelector("#history-container").addEventListener("click", e => e.stopPropagation());
  document.querySelector("#favorites-container").addEventListener("click", e => e.stopPropagation());
  document.querySelector("#token-panel").addEventListener("click", e => e.stopPropagation());

  document.querySelector("#navbar-form").onsubmit = (e) => {
    e.preventDefault();
    const username = document.querySelector("#username").value.trim();
    if (username) loadUser(username);
  };

  document.querySelector("#hero-form").onsubmit = (e) => {
    e.preventDefault();
    const username = document.querySelector("#hero-username").value.trim();
    if (username) loadUser(username);
  };

  document.querySelector("#back-btn").onclick = showHero;
  document.querySelector("#github-logo").onclick = showHero;
});

const params = new URLSearchParams(window.location.search);
const userFromURL = params.get("user");
if (userFromURL) loadUser(userFromURL);