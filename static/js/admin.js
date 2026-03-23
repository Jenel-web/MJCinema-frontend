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






// Nav click handlers
// Nav click handlers
document.getElementById('home').addEventListener('click', function () {
    setActiveNav(this);
    showSection('home-content');
    loadHome();
});

document.getElementById('movies').addEventListener('click', function () {
    setActiveNav(this);
    showSection('movies-content');
    // loadMovies();
});

document.getElementById('schedules').addEventListener('click', function () {
    setActiveNav(this);
    showSection('schedules-content');
    // loadSchedules();
});

document.getElementById('bookings').addEventListener('click', function () {
    setActiveNav(this);
    showSection('bookings-content');
    // loadBookings();
});

document.getElementById('users').addEventListener('click', function () {
    setActiveNav(this);
    showSection('users-content');
    // loadUsers();
});

// Helpers
function setActiveNav(el) {

  if (!el) return;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

function showSection(sectionId) {
  if(!sectionId) return;
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}


// Load home data on page start
loadHome();
loadSalesTrend();
showSection();
