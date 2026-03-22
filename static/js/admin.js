const baseUrl = "http://localhost:8080";

async function loadHome() {
  const bookingsEl = document.getElementById("totalBookings")
  const salesEl = document.getElementById("totalSales");
  const usersEl = document.getElementById("totalUsers");
  const revenueEl = document.getElementById("revenueToday")
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
        "₱" +
        Number(data).toLocaleString("en-PH", { minimumFractionDigits: 2 });
    } catch (err) {
      revenueEl.textContent = "N/A";
      console.error("Error fetching total sales:", err);
    }

}

// Nav click handlers
document.getElementById("home").addEventListener("click", function () {
    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.remove("active"));
    this.classList.add("active");
        loadHome();
    // Add other nav handlers here as needed:
    // if (label.includes('Movies')) loadMovies();
    // if (label.includes('Schedules')) loadSchedules();
    // etc.
  });
;

// Load home data on page start
loadHome();
