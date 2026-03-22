const baseUrl = "http://localhost:8080";

async function loadHome() {
  const salesEl = document.getElementById("totalSales");
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
}

// Nav click handlers
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.remove("active"));
    this.classList.add("active");

    const label = this.textContent.trim();

    if (label.includes("Home")) {
      loadHome();
    }

    // Add other nav handlers here as needed:
    // if (label.includes('Movies')) loadMovies();
    // if (label.includes('Schedules')) loadSchedules();
    // etc.
  });
});

// Load home data on page start
loadHome();
