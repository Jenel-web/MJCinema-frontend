async function initBooking() {
  const scheduleId = localStorage.getItem("selectedScheduleId");

  // 1. Fetch Schedule (including Cinema layout)
  const response = await fetch(`http://localhost:8080/schedule/${scheduleId}`);
  const schedule = await response.json();

  // 2. Setup the Grid based on Cinema dimensions
  const cinema = schedule.cinema;

  //get the prices
  const result = await fetch(`http://localhost:8080/schedule/schedPrice/${scheduleId}`);
  const prices = await result.json();
  let priceList = {};

  prices.forEach(item => {
    priceList[item.seatCategory] = item.price;
  });
  console.log(priceList.VIP)
  console.log(priceList.REGULAR)
  console.log(priceList.BALCONY)
  
  renderBlueprint(cinema.totalRows, cinema.totalColumns, cinema.seatLayout);
}

async function getOccupiedSeats(scheduleId){
    const response = await fetch(`http://localhost:8080/seat/occupied/${scheduleId}`);

    const occupiedSeats = await response.json()

    return occupiedSeats;
}

function renderBlueprint(rows, layoutString, occupiedSeats) {
  const grid = document.getElementById("seat-grid");
  const cols = layoutString.length;

  // Set CSS Variable for grid columns
  grid.style.setProperty("--grid-cols", cols);
  grid.innerHTML = "";
  for (let r = 0; r < rows; r++) {
    // Generates A, B, C, D...
    const rowLetter = String.fromCharCode(65 + r);

    for (let i = 0; i < layoutString.length; i++) {
      const char = layoutString[i];
      const seatNumber = i + 1;
      const seatId = `${rowLetter}${seatNumber}`;

      if (char === "_") {
        // Create an empty space for an aisle
        const spacer = document.createElement("div");
        spacer.className = "aisle-spacer";
        grid.appendChild(spacer);
      } else {
        // Create a clickable seat
        const seat = document.createElement("div");
        seat.className = "seat";
        
        // If the seat is in the 'occupied' list from backend
        if (occupiedSeats.includes(seatId)) {
          seat.classList.add("occupied");
        } else {
          seat.onclick = () => handleSeatClick(seat, seatId);
        }

        grid.appendChild(seat);
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
  document.getElementById("display-seats").innerText =
    selectedSeats.join(", ") || "None";
  document.getElementById("display-total").innerText = (
    selectedSeats.length * ticketPrice
  ).toLocaleString();
}
