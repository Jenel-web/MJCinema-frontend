const baseUrl = "http://localhost:8080";

async function loadHome() {
  const bookingsEl = document.getElementById("totalBookings");
  const salesEl = document.getElementById("totalSales");
  const usersEl = document.getElementById("totalUsers");
  const revenueEl = document.getElementById("revenueToday");
  salesEl.textContent = "Loading...";
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${baseUrl}/ticket/totalSales`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    salesEl.textContent =
      "₱" + Number(data).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  } catch (err) {
    salesEl.textContent = "N/A";
    console.error("Error fetching total sales:", err);
  }

  try {
    const res = await fetch(`${baseUrl}/ticket/showTotalBookings`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    bookingsEl.textContent = Number(data).toLocaleString("en-PH");
  } catch (err) {
    bookingsEl.textContent = "N/A";
    console.error("Error fetching total bookings:", err);
  }

  try {
    const res = await fetch(`${baseUrl}/user/showTotalUsers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    usersEl.textContent = Number(data).toLocaleString("en-PH");
  } catch (err) {
    usersEl.textContent = "N/A";
    console.error("Error fetching total users:", err);
  }

  try {
    const res = await fetch(`${baseUrl}/ticket/showRevenueToday`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    revenueEl.textContent =
      "₱" + Number(data).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  } catch (err) {
    revenueEl.textContent = "N/A";
    console.error("Error fetching revenue today:", err);
  }
  await loadSalesTrend();
}

let salesTrendChartInstance = null;

async function loadSalesTrend() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${baseUrl}/ticket/getSalesTrend`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();

    // Format labels as "Week of Dec 29" from the Monday date keys
    const labels = Object.keys(data).map((dateStr) => {
      const date = new Date(dateStr);
      return (
        "Wk of " +
        date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
      );
    });

    const values = Object.values(data);

    const ctx = document.getElementById("salesTrendChart").getContext("2d");

    // Destroy previous instance if re-called
    if (salesTrendChartInstance) {
      salesTrendChartInstance.destroy();
    }

    salesTrendChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Bookings",
            data: values,
            borderColor: "#27ae60",
            backgroundColor: "rgba(39, 174, 96, 0.08)",
            borderWidth: 2.5,
            pointBackgroundColor: "#27ae60",
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0d1b2a",
            titleColor: "#d4a97a",
            bodyColor: "#ffffff",
            padding: 10,
            callbacks: {
              label: (ctx) => " " + ctx.parsed.y + " bookings",
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "Jost", size: 11 },
              color: "#a0aec0",
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)" },
            ticks: {
              stepSize: 5,
              font: { family: "Jost", size: 11 },
              color: "#a0aec0",
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error fetching sales trend:", err);
  }
}

async function loadMovieLeaderboard() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("movie-leaderboard");
  container.innerHTML =
    '<p style="color: var(--muted); font-size: 13px;">Loading...</p>';

  try {
    const res = await fetch(`${baseUrl}/movie/leaderboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();

    const medals = ["🥇", "🥈", "🥉"];
    const colors = ["#c9973d", "#a0aec0", "#b07d55"];

    container.innerHTML = data
      .map(
        (movie, i) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank" style="color: ${colors[i]}">${
          medals[i]
        }</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-title">${movie.title}</div>
                    <div class="leaderboard-bar-wrap">
                        <div class="leaderboard-bar" style="width: ${
                          (movie.revenue / data[0].revenue) * 100
                        }%; background: ${colors[i]}"></div>
                    </div>
                </div>
                <div class="leaderboard-revenue">₱${Number(
                  movie.revenue
                ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
            </div>
        `
      )
      .join("");
  } catch (err) {
    container.innerHTML =
      '<p style="color: var(--muted); font-size: 13px;">Failed to load.</p>';
    console.error("Error fetching movie leaderboard:", err);
  }
}

async function loadMovieCount() {
  const token = localStorage.getItem("token");
  const el = document.getElementById("movieCount");
  el.textContent = "Loading...";

  try {
    const res = await fetch(`${baseUrl}/movie/showActiveCount`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    el.textContent = `${data.activeCount}/${data.totalCount}`;
  } catch (err) {
    el.textContent = "N/A";
    console.error("Error fetching movie count:", err);
  }
}

let allMovies = [];

async function loadMovieTable() {
  const tbody = document.getElementById("movieTableBody");
  const token = localStorage.getItem("token");
  tbody.innerHTML =
    '<tr><td colspan="6" class="table-loading">Loading...</td></tr>';

  try {
    const res = await fetch(`${baseUrl}/movie/showMovieTable`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    allMovies = await res.json();
    renderMovieTable(allMovies);
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="table-loading">Failed to load.</td></tr>';
    console.error("Error fetching movie table:", err);
  }
}

function renderMovieTable(movies) {
  const tbody = document.getElementById("movieTableBody");

  if (!movies.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="table-loading">No movies found.</td></tr>';
    return;
  }

  const statusMap = {
    NOW_SHOWING: { label: "Now Showing", cls: "pill-now-showing" },
    COMING_SOON: { label: "Coming Soon", cls: "pill-coming-soon" },
    INACTIVE: { label: "Inactive", cls: "pill-inactive" },
    NEW: {label: "New", cls: "pill-new"}, 
  };

  tbody.innerHTML = movies
    .map((m, i) => {
      const status = statusMap[m.status] || {
        label: m.status,
        cls: "pill-inactive",
      };
      const rating = Number(m.rating).toFixed(1);
      const revenue = Number(m.revenue).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
      });
      const date = new Date(m.releaseDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return `
            <tr>
                <td style="color: var(--muted); font-size: 12px;">${i + 1}</td>
                <td style="font-weight: 500;">${m.title}</td>
                <td>
                    <div class="rating-stars">
                        <span>★</span>
                        <span style="color: var(--white); font-size: 13px;">${rating}</span>
                    </div>
                </td>
                <td style="color: var(--muted); font-size: 12px;">${date}</td>
                <td><span class="status-pill ${status.cls}">${
        status.label
      }</span></td>
                <td style="font-family: 'Playfair Display', serif; font-weight: 600;">₱${revenue}</td>
            </tr>
        `;
    })
    .join("");
}

function filterMovieTable() {
  const query = document.getElementById("movieSearchInput").value.toLowerCase();
  const filtered = allMovies.filter((m) =>
    m.title.toLowerCase().includes(query)
  );
  renderMovieTable(filtered);
}

// ── ADD MOVIE MODAL ──

function openAddMovieModal() {
  document.getElementById("addMovieModal").style.display = "flex";
  document.getElementById("tmdbSearchInput").value = "";
  document.getElementById("tmdbResults").innerHTML =
    '<p class="tmdb-empty">Search for a movie to get started.</p>';
  setTimeout(() => document.getElementById("tmdbSearchInput").focus(), 100);
}
function closeAddMovieModal() {
  document.getElementById("addMovieModal").style.display = "none";
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById("addMovieModal"))
    closeAddMovieModal();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAddMovieModal();
});

async function searchTmdb() {
  const token = localStorage.getItem("token");
  const query = document.getElementById("tmdbSearchInput").value.trim();
  const results = document.getElementById("tmdbResults");

  if (!query) return;

  results.innerHTML = '<p class="tmdb-loading">Searching...</p>';

  try {
    const res = await fetch(
      `${baseUrl}/movie/tmdb/search?name=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error("Search failed");

    const movies = await res.json();

    if (!movies.length) {
      results.innerHTML = '<p class="tmdb-empty">No results found.</p>';
      return;
    }

    results.innerHTML = movies
      .map((m) => {
        const year = m.release_date
          ? new Date(m.release_date).getFullYear()
          : "—";
        const rating = m.vote_average ? Number(m.vote_average).toFixed(1) : "—";
        const posterUrl = m.poster_path
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : null;
        const poster = posterUrl
          ? `<img class="tmdb-poster" src="${posterUrl}" alt="${m.title}" loading="lazy" />`
          : `<div class="tmdb-poster-placeholder">🎬</div>`;

        return `
                <div class="tmdb-card" onclick="selectTmdbMovie(${m.id})">
                    ${poster}
                    <div class="tmdb-info">
                        <div class="tmdb-info-title">${m.title}</div>
                        <div class="tmdb-info-meta">
                            <span>${year}</span>
                            <div class="tmdb-info-rating">★ ${rating}</div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (err) {
    results.innerHTML =
      '<p class="tmdb-empty">Search failed. Please try again.</p>';
    console.error("TMDB search error:", err);
  }
}

async function selectTmdbMovie(movieId) {
  const token = localStorage.getItem("token")
  const data = {
    id: movieId
  }
  try {
    const res = await fetch(`${baseUrl}/movie/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const message = await res.text();
    closeAddMovieModal();
    showToast(res.ok ? "success" : "error", message);

    if (res.ok) {
      loadMovieTable();
      loadMovieCount();
      loadMovieLeaderboard();
    }
  } catch (err) {
    closeAddMovieModal();
    showToast("error", "Something went wrong. Please try again.");
    console.error("Add movie error:", err);
  }
}

function showToast(type, message) {
  const existing = document.getElementById("toastPopup");
  if (existing) existing.remove();

  const icon = type === "success" ? "✅" : "❌";
  const toast = document.createElement("div");
  toast.id = "toastPopup";
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
  document.body.appendChild(toast);

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

async function loadShowtimeLeaderboard() {
  const token = localStorage.getItem("token")
  const container = document.getElementById("showtime-leaderboard");
  container.innerHTML =
    '<p style="color: var(--muted); font-size: 13px;">Loading...</p>';

  try {
    const res = await fetch(`${baseUrl}/schedule/bestShowtime`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();

    const medals = ["🥇", "🥈", "🥉"];
    const colors = ["#c9973d", "#a0aec0", "#b07d55"];
    const slotIcons = { MORNING: "🌅", AFTERNOON: "☀️", EVENING: "🌙" };

    container.innerHTML = data
      .map(
        (item, i) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank" style="color: ${colors[i]}">${
          medals[i]
        }</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-title">
                        ${slotIcons[item.slot] || "🎬"} ${
          item.slot.charAt(0) + item.slot.slice(1).toLowerCase()
        }
                    </div>
                    <div class="leaderboard-bar-wrap">
                        <div class="leaderboard-bar" style="width: ${
                          (item.averageRevenue / data[0].averageRevenue) * 100
                        }%; background: ${colors[i]}"></div>
                    </div>
                </div>
                <div class="leaderboard-revenue">₱${Number(
                  item.averageRevenue
                ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
            </div>
        `
      )
      .join("");
  } catch (err) {
    container.innerHTML =
      '<p style="color: var(--muted); font-size: 13px;">Failed to load.</p>';
    console.error("Error fetching showtime leaderboard:", err);
  }
}


// Schedule Section
async function loadScheduleCount() {
  const token = localStorage.getItem("token")
  const el = document.getElementById("scheduleCount");
  el.textContent = "Loading...";

  try {
    const res = await fetch(`${baseUrl}/schedule/showScheduleCount`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    el.textContent = Number(data).toLocaleString("en-PH");
  } catch (err) {
    el.textContent = "N/A";
    console.error("Error fetching schedule count:", err);
  }
}
 

async function loadAvgRevenuePerSchedule() {
  const el = document.getElementById("avgRevenuePerSchedule");
  const token = localStorage.getItem("token")
  el.textContent = "Loading...";

  try {
    const res = await fetch(`${baseUrl}/schedule/showAverageRevenue`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    el.textContent =
      "₱" + Number(data).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  } catch (err) {
    el.textContent = "N/A";
    console.error("Error fetching average revenue per schedule:", err);
  }
}


// Nav click handlers
document.getElementById("home").addEventListener("click", function () {
  setActiveNav(this);
  showSection("home-content");
  loadHome();
});

document.getElementById("movies").addEventListener("click", function () {
  setActiveNav(this);
  showSection("movies-content");
  loadMovieLeaderboard();
  loadMovieCount();
  loadMovieTable();
});

document.getElementById("schedules").addEventListener("click", function () {
  setActiveNav(this);
  showSection("schedules-content");
  loadShowtimeLeaderboard();
  loadScheduleCount();
  loadAvgRevenuePerSchedule();
  // loadSchedules();
});

document.getElementById("bookings").addEventListener("click", function () {
  setActiveNav(this);
  showSection("bookings-content");
  // loadBookings();
});

document.getElementById("users").addEventListener("click", function () {
  setActiveNav(this);
  showSection("users-content");
  // loadUsers();
});

// Helpers
function setActiveNav(el) {
  if (!el) return;
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  el.classList.add("active");
} //shows which nav is active

function showSection(sectionId) {
  if (!sectionId) return;
  document
    .querySelectorAll(".page-section")
    .forEach((s) => (s.style.display = "none"));
  document.getElementById(sectionId).style.display = "block";
}

// Load home data on page start
loadHome();
loadSalesTrend();
showSection();

// make this public for html
window.openAddMovieModal = openAddMovieModal;
window.closeAddMovieModal = closeAddMovieModal;
window.searchTmdb = searchTmdb;
window.handleOverlayClick = handleOverlayClick;
window.selectTmdbMovie = selectTmdbMovie;
window.loadAvgRevenuePerSchedule = loadAvgRevenuePerSchedule;