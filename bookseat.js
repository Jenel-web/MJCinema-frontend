let priceList = {};
let selectedSeats = [];

async function initBooking() {
  const scheduleId = localStorage.getItem("selectedScheduleId");

  if (!scheduleId) {
    console.error("No Schedule ID found! Redirecting to home...");
    window.location.href = "index.html";
    return;
  }
  // 1. Fetch Schedule (including Cinema layout)
  const response = await fetch(`http://localhost:8080/schedule/${scheduleId}`);
  const schedule = await response.json();

  // 2. Setup the Grid based on Cinema dimensions
  const cinema = schedule.cinema;
  if (schedule && schedule.movie) {
    document.getElementById("movie-title").innerText = schedule.movie.title;
  } else {
    console.error("Movie data is missing in the schedule response!", schedule);
    document.getElementById("movie-title").innerText = "Title Unavailable";
  }
  //get the prices
  const result = await fetch(
    `http://localhost:8080/schedule/schedPrice/${scheduleId}`
  );
  const prices = await result.json();
  const selected = await getOccupiedSeats(scheduleId); //makes the array of strings of selected seats

  prices.forEach((item) => {
    priceList[item.seatCategory] = item.price;
  }); //initializes the prices of the tickets

  renderBlueprint(
    cinema.totalRows,
    cinema.totalColumns,
    cinema.seatLayout,
    selected
  ); //takes the arguments
}

async function getOccupiedSeats(scheduleId) {
  const response = await fetch(
    `http://localhost:8080/seat/occupied/${scheduleId}`
  );

  const occupiedSeats = await response.json();

  return occupiedSeats;
}
function renderBlueprint(rows, cols, layoutString, occupiedSeats = []) {
  const grid = document.getElementById("seat-grid");

  // Set columns based on the length of the string (including underscores)
  grid.style.setProperty("--grid-cols", layoutString.length);
  grid.innerHTML = "";

  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    let seatNumberInRow = 1; // Reset for every new row (A, B, C...)

    for (let i = 0; i < layoutString.length; i++) {
      const char = layoutString[i];

      if (char === "_") {
        // If underscore, create an invisible spacer
        const spacer = document.createElement("div");
        spacer.className = "aisle-spacer";
        grid.appendChild(spacer);
      } else {
        // If 'S', create a seat and give it the next number
        const seatId = `${rowLetter}${seatNumberInRow}`;
        const seat = document.createElement("div");
        seat.className = "seat";



        if (occupiedSeats.includes(seatId)) {
          seat.classList.add("occupied");
        } else {
          seat.onclick = () => handleSeatClick(seat, seatId);
        }

        grid.appendChild(seat);
        seatNumberInRow++; // Increment only for actual seats
      }
    }
  }
}

function handleSeatClick(seatElement, seatId) {
  if (seatElement.classList.contains("selected")) {
    seatElement.classList.remove("selected");
    selectedSeats = selectedSeats.filter((id) => id !== seatId);
  } else {
    seatElement.classList.add("selected");
    selectedSeats.push(seatId);
  }
  updateUI();
}

function updateUI() {
  let total = 0;

  // Calculate total based on row category
  selectedSeats.forEach((id) => {
    const row = id.charAt(0);
    let category = "REGULAR";
    if (row === "A" || row === "B") category = "VIP";
    if (row === "G" || row === "H") category = "BALCONY";

    total += priceList[category] || 0;
  });

  document.getElementById("display-seats").innerText =
    selectedSeats.join(", ") || "None";
  document.getElementById("display-total").innerText = total.toLocaleString();
}

document.addEventListener("DOMContentLoaded", () => {
  initBooking();
});
