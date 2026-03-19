import { UI } from "./ui.js";
import { Auth } from "./auth.js";
const baseUrl = "http://localhost:8080";
const authApp = new Auth(); //automatically does what the function sayss
const ui = new UI(); //imports UI and instantiates

const movies = await fetch(`${baseUrl}/movie/show`); //use backticks
const allMovies = await movies.json();
const token = localStorage.getItem("token");
// Force it onto the window object explicitly
window.allMovies = Array.from(allMovies); //saves all the movies in the db
//for movie booking
function openMovieDetails(movie, type) {
  const modal = document.getElementById("movie-modal"); //gets id
  const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

  //html that will be shown when the movie is clicked
  modal.innerHTML = `
          <div class="modal-content">
              <span class="close" onclick="closeModal()">&times;</span>
              
              <img src="${imageBaseUrl + movie.poster}" alt="${
    movie.title
  }" style="width: 250px; border-radius: 10px;">
              
              <div class="modal-info">
                  <div class="modal-header">
                      <h2>${movie.title}</h2>
                      <span class="rating">⭐ ${movie.rating} / 10</span>
                  </div>
                  
                  <p class="overview">${movie.overview}</p>
                  ${
                    type === "now"
                      ? `<button
                        class="book-btn-modal"
                        onclick="proceedToBooking(${movie.movieId})">Book Seats
                      </button>`
                      : ""
                  }
                  <div id="schedule-container"></div>
              </div>
          </div>
      `;

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

//this is used to show the movies in grid form
async function loadMovies(url, type) {
  try {
    const movieGrid = document.getElementById("movie-grid");
    const cinemaGrid = document.getElementById("cinema-tab-section");
    cinemaGrid.classList.add("hidden");
    movieGrid.classList.remove("hidden");
    const response = await fetch(url);
    const data = await response.json();

    console.log(
      "Data successfully saved to window.allMovies:",
      window.allMovies
    ); //saves all the movies here so that ClickedCardHandler can use it later.
    const grid = document.getElementById("movie-grid");

    if (!Array.isArray(data)) {
      console.error("Backend sent an object instead of a list:", data);
      grid.innerHTML = "<p>Unexpected data format from server.</p>";
      return; //checks the data send by the backend
    }
    // We use .map().join('') here because it's faster than innerHTML += in a loop
    const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

    grid.innerHTML = data
      .map(
        (movie) => `
        <div class="movie-card" onclick = "ClickedCardHandler(${
          movie.movieId
        }, '${type}')"> 
            <img src="${imageBaseUrl + movie.poster}" alt="${movie.title}">
            <div class="card-info">
                <h3>${movie.title}</h3>
                ${
                  type === "now"
                    ? ""
                    : `<p class="coming-soon-tag">Coming Soon</p> 
                      <h2 class="movie-date">${
                        movie.showDate ? movie.showDate : "TBA"
                      }</h2>`
                  // this is for the showdate to be shown if there is and none if there is none.
                }
            </div>
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("The cinema is closed!", error);
    document.getElementById("movie-grid").innerHTML =
      "<p>Failed to load movies.</p>";
  }
}

function ClickedCardHandler(movieId, type) {
  const idFinder = Number(movieId);
  const allMovies = window.allMovies;
  const movie = window.allMovies.find((m) => Number(m.movieId) === idFinder); //finds the movieId

  if (!movie) {
    console.error(
      "Search failed! Checked " +
        window.allMovies.length +
        " movies but couldn't find ID: " +
        idFinder
    );
    console.log("Current Array Data:", window.allMovies);
    return;
    //only shows the HTML
  }
  openMovieDetails(movie, type);
  localStorage.setItem("movieId", movieId);
}

function closeModal() {
  const modal = document.getElementById("movie-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // Re-enable background scrolling
  }
} // this is for closing the popup.

const movieId = localStorage.getItem("movieId"); //should use quotation marks for the fetching of variable

//for booking
async function proceedToBooking(movieId) {
  const baseUrl = "http://localhost:8080"; //makes the base url thank can be accessed within the function
  const bookBtn = document.querySelector(".book-btn-modal"); //button class
  if (bookBtn) {
    try {
      const response = await fetch(
        `${baseUrl}/schedule/movieSchedules/${movieId}` //use backticks for the string
      );

      if (!response.ok) {
        console.log("unable to fetch schedules");
      }

      const schedules = await response.json(); //make the response in json form
      bookBtn.style.display = "none";
      renderScheduleSelection(schedules); //function to show schedules in html form
    } catch (e) {
      console.error("Error:", e);
    }
  }
}

function renderScheduleSelection(schedules) {
  const container = document.getElementById("schedule-container"); //parent div which should be in the html
  container.innerHTML = `<h3>Select a Showtime</h3>`;

  // 1. Create the dropdown (select) element
  const select = document.createElement("select"); //creates element
  select.id = "showtime-dropdown"; //initalized the class and id of the new element
  select.className = "schedule-dropdown";

  // 2. Add a default "Choose" option
  const defaultOpt = document.createElement("option");
  defaultOpt.text = "-- Choose a showtime --";
  defaultOpt.value = "";
  select.appendChild(defaultOpt); //adds this new variable to select

  // 3. Fill the dropdown with schedules
  schedules.forEach((sched) => {
    const option = document.createElement("option");
    option.value = sched.scheduleId; // The ID we need for booking (scheduleId)
    option.text = `${sched.showDate} | ${sched.startTime} - ${sched.cinema.location}`; //takes the data from the json
    select.appendChild(option); //appends to select
  });

  // 4. Create a "Proceed" button
  const proceedBtn = document.createElement("button"); //creates the button
  proceedBtn.innerText = "Select Seats";
  proceedBtn.className = "confirm-sched-btn";

  proceedBtn.onclick = () => {
    const selectedId = select.value; //the schedId of the value from the option
    if (!selectedId) {
      alert("Please select a time slot first!"); //checks if the user selects a schedule
      return;
    }
    // Save and redirect
    localStorage.setItem("selectedScheduleId", selectedId); //takes the selected scheduleId and saves it
    window.location.href = "bookseat.html"; //redirected to booking
  };

  container.appendChild(select);
  container.appendChild(proceedBtn);
}
// Function to show the Cinema Tab
async function loadCinemaTab() {
  const cinemaSection = document.getElementById("cinema-tab-section");
  const squaresContainer = document.getElementById("cinema-squares"); //gets the element
  const moviesGrid = document.getElementById("movie-grid");
  const cinemaMovies = document.getElementById("cinema-movies-grid");

  cinemaMovies.classList.add("hidden");
  cinemaSection.classList.remove("hidden");
  moviesGrid.classList.add("hidden");
  try {
    const response = await fetch("http://localhost:8080/cinema/all"); //takes all the cinema
    const cinemas = await response.json(); //jsonify

    // Map through your cinemas and turn them into HTML cards
    squaresContainer.innerHTML = cinemas
      .map(
        (c) => `
              <div class="cinema-card" onclick="showMoviesInCinema(${c.cinemaId}, '${c.location}', '${c.cinemaName}')">
                  <div class="cinema-icon">🎬</div>
                  <h3>${c.cinemaName}</h3>
                  <p>${c.location}</p>
              </div>
          `
      )
      .join(""); //joins them
  } catch (err) {
    squaresContainer.innerHTML = `<p>Error connecting to MJCinema server.</p>`;
  }
}

// Function to show movies for a specific cinema
async function showMoviesInCinema(cinemaId, location, cinemaName) {
  const gridView = document.getElementById("cinema-grid-view");
  const detailView = document.getElementById("cinema-detail-view");
  const movieGrid = document.getElementById("cinema-movies-grid");

  document.getElementById("active-cinema-name").innerText = ` ${cinemaName}`;

  try {
    const response = await fetch(
      `http://localhost:8080/cinema/movies/${cinemaId}`
    );
    const movies = await response.json();

    gridView.classList.add("hidden"); //hides the cinema grid
    detailView.classList.remove("hidden"); //shows the movie grid

    if (movies.length === 0) {
      movieGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No movies currently playing here.</p>`;
      return;
    } //sends a message if there are no movies

    const imageBaseUrl = "https://image.tmdb.org/t/p/w500";
    movieGrid.innerHTML = movies
      .map(
        (m) =>
          `
              <div class="movie-card" onclick="ClickedCardHandler(${
                m.movieId
              }, 'soon')">
                  <img src="${imageBaseUrl + m.poster}" alt="${m.title}">
                  <div class="card-info">
                      <h3>${m.title}</h3>
                      <p>⭐ ${m.rating} / 10</p>
                      <p class = "status-movie">${m.status.replaceAll(
                        "_",
                        " "
                      )}</p>
                  </div>
              </div>
          `
      )
      .join("");
  } catch (err) {
    console.error("Error loading movies:", err);
  }
}

function backToCinemas() {
  document.getElementById("cinema-grid-view").classList.remove("hidden");
  document.getElementById("cinema-detail-view").classList.add("hidden");
}

// 1. This handles opening and closing when you click the "Account" button
export function toggleProfile(event) {
  event.stopPropagation(); // Stops the 'Window' from hearing this click
  const popup = document.getElementById("profile-popup");
  popup.classList.toggle("hidden");
}

// 2. This handles closing when you click AWAY from the menu
window.addEventListener("click", function (e) {
  const popup = document.getElementById("profile-popup");
  const profileBtn = document.querySelector(".profile-trigger");

  // If the menu is open AND you clicked outside both the button and the menu

  if (!popup) return;
  // Check: Is the popup currently visible?
  const isVisible = !popup.classList.contains("hidden");

  // Check: Did the user click somewhere OTHER than the popup or the button?
  if (
    isVisible &&
    !popup.contains(e.target) &&
    !profileBtn.contains(e.target)
  ) {
    popup.classList.add("hidden"); // Explicitly hide it, don't toggle
  }
});

export function handleLogout() {
  window.location.href = "index.html";
  localStorage.clear();
}
window.filterByStatus = function (status) {
  const allCards = document.querySelectorAll(".schedule-card");

  allCards.forEach((card) => {
    const hasActive = card.getAttribute("data-has-active") === "true";
    const hasCancelled = card.getAttribute("data-has-cancelled") === "true";

    // Step A: Decide if the card should be visible in this tab
    let showCard = false;
    if (status === "ACTIVE" && hasActive) showCard = true;
    if (status === "CANCELLED" && hasCancelled) showCard = true;
    if (status === "COMPLETED") showCard = true;
    card.style.display = showCard ? "block" : "none";

    // Step B: Filter individual rows inside the visible card
    if (showCard) {
      const rows = card.querySelectorAll(".seat-row");
      let visibleSeatCount = 0;

      rows.forEach((row) => {
        if (row.getAttribute("data-seat-status") === status) {
          row.style.display = "flex";
          visibleSeatCount++;
        } else {
          row.style.display = "none";
        }
      });

      // Step C: Update header text to reflect the current tab's count
      const countDisplay = card.querySelector(".count");
      countDisplay.innerHTML = `${visibleSeatCount} ${
        status === "ACTIVE"
          ? "Active"
          : status === "CANCELLED"
          ? "Cancelled"
          : "Completed"
      } Seats <i class="arrow-icon">▼</i>`;
    }
  });

  // UI: Update tab button active states
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.innerText.trim().toUpperCase() === status
    );
  });
};

export function showBookings() {
  window.location.href = "tickets.html";
}

function groupTicketsBySchedule(tickets) {
  return tickets.reduce((groups, ticket) => {
    const key = `${ticket.title}-${ticket.showDate}-${ticket.startTime}`;

    if (!groups[key]) {
      groups[key] = {
        title: ticket.title,
        date: ticket.showDate,
        time: ticket.startTime,
        location: ticket.location,
        hasActive: false, // Track if any are active
        hasCancelled: false, // Track if any are cancelled
        seats: [],
      };
    }

    groups[key].seats.push({
      num: ticket.seatNumber,
      cat: ticket.seatCategory,
      code: ticket.ticketCode,
      status: ticket.ticketStatus,
    });

    if (ticket.ticketStatus === "ACTIVE") groups[key].hasActive = true;
    if (ticket.ticketStatus === "CANCELLED") groups[key].hasCancelled = true;

    return groups;
  }, {});
}
function renderGroupedTickets(groupedData) {
  const container = document.getElementById("tickets-container");
  if (!container) return;
  container.innerHTML = "";

  Object.values(groupedData).forEach((group) => {
    const scheduleHTML = `
    <div class="schedule-card" 
         data-has-active="${group.hasActive}" 
         data-has-cancelled="${group.hasCancelled}">
        
        <div class="schedule-header" onclick="this.parentElement.classList.toggle('open')">
            <div class="info">
                <strong>${group.title}</strong>
                <small>📍 ${group.location} | ${group.date} at ${
      group.time
    }</small>
            </div>
            <div class="count">
                </div>
        </div>
        
        <div class="seats-drawer">
            ${group.seats
              .map(
                (seat) => `
                <div class="seat-row" data-seat-status="${seat.status}">
                    <div class="seat-main-info">
                        <span>💺 Seat ${seat.num} (${seat.cat})</span>
                        <span class="ticket-code">${seat.code}</span>
                    </div>
                    ${
                      seat.status === "ACTIVE"
                        ? `<button class="tap-to-cancel" onclick="handleTicketTap('${seat.code}')">Cancel</button>`
                        : seat.status === "CANCELLED"
                        ? `<span class="status-tag">CANCELLED</span>`
                        : `<span class="status-tag">COMPLETED</span>`
                    }
                </div>`
              )
              .join("")}
        </div>
    </div>`;

    container.insertAdjacentHTML("beforeend", scheduleHTML);
  });

  //must be outside the loop
  const backBtnHTML = `<button class="btn-back" onclick="history.back()">
                       Back
                     </button>`;

  container.insertAdjacentHTML("beforeend", backBtnHTML); //draws the button
  // Initial run to show ACTIVE tickets by default
  window.filterByStatus("ACTIVE");
}
window.handleTicketTap = function (seatCode) {
  // You can use a custom Modal here, but for now, let's keep it robust with a confirm dialog
  const userConfirmed = confirm(
    `Ticket: ${seatCode}\n\nDo you wish to cancel this booking? This action cannot be undone.`
  );

  if (userConfirmed) {
    cancelTicket(seatCode);
  }
};

export async function cancelTicket(seatCode) {
  //if (!confirm(`Are you sure you want to cancel ticket ${ticketCode}?`)) return;
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${baseUrl}/ticket/cancel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, //this is the token for auth
      },
      credentials: "include",
      body: JSON.stringify({
        ticketCode: seatCode,
      }),
    });
    if (response.ok) {
      alert("Ticket cancelled successfully.");
      initBooking();

      loadUserTickets(); // Refresh the UI to show the new status
    } else {
      const errorData = await response.json();
      console.log("Full Error From Backend:", errorData); // Look for "message" or "errors"
      alert(`Error: ${errorData.message || "Failed to cancel"}`);
    }
  } catch (err) {
    console.error(err); // 2. Good practice to log the actual error
  }
}
export async function loadUserTickets() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("tickets-container");
  const id = localStorage.getItem("userId");
  if (!id) {
    //check if the user is logged in.
    container.innerHTML = "<p>Please log in to view your tickets.</p>";
    return;
  }
  try {
    const response = await fetch(`${baseUrl}/ticket/mytickets?userId=${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, // 2. Add the token here!
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tickets");
    }
    const allTickets = await response.json(); //all tickets booke by user.

    const groupedData = groupTicketsBySchedule(allTickets);

    renderGroupedTickets(groupedData);
  } catch (error) {
    console.error("Error: ", error);
    if (container)
      container.innerHTML =
        "<p>Error loading tickets. Please try again later.</p>";
  }
}

export async function getUserDetails() {
  const userID = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${baseUrl}/user/getUser?userId=${userID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, // 2. Add the token here!
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Error fetching user Details");
    }
    const result = await response.json();

    return result;
  } catch (err) {
    console.error("Fetch Error:", err);
    throw err;
  }
}
export async function updateSidebarUserInfo() {
  try {
    // 1. Fetch the data using your existing method
    const userData = await getUserDetails();

    // 2. Select the elements
    const nameElement = document.getElementById("display-username");
    const balanceElement = document.getElementById("display-balance");

    if (userData) {
      // 3. Update Username
      // Use .name or .username depending on your Backend Entity field name
      nameElement.innerText = `👤 ${userData.username}`;

      // 4. Update Balance (formatted as Philippine Peso)
      const balance = userData.balance || 0;
      balanceElement.innerText = `₱${parseFloat(balance).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;
    }
  } catch (error) {
    console.error("Failed to update sidebar:", error);
    document.getElementById("display-username").innerText = "👤 Profile";
  }
}
const profile = document.getElementById("profile");
const nowShowing = document.getElementById("now-showing");
const comingSoon = document.getElementById("coming-soon");
const cinema = document.getElementById("cinema");
//its loaded the moment the browser is opened.
if (nowShowing) {
  nowShowing.addEventListener("click", (e) => {
    e.preventDefault();
    const movie = document.getElementById("movieCard");
    loadMovies("http://localhost:8080/schedule/now-showing", "now");
    //uses the movie as a parameter
  });
} //if the nav button now showing is tapped. it will show the now showing movies html
if (comingSoon) {
  comingSoon.addEventListener("click", (e) => {
    e.preventDefault();
    loadMovies("http://localhost:8080/schedule/coming-soon", "soon"); //this is where the typex comes from
  });
}
if (cinema) {
  cinema.addEventListener("click", async (e) => {
    e.preventDefault();
    loadCinemaTab();
  });
}
if (profile) {
  profile.addEventListener("click", (e) => {
    e.preventDefault();
    toggleProfile(e);
  });
}
if (document.getElementById("tickets-container")) {
  loadUserTickets();
  updateSidebarUserInfo();
}

if (document.getElementById("booking-sidebar")) {
}
window.ClickedCardHandler = ClickedCardHandler;
window.closeModal = closeModal;
window.loadMovies = loadMovies;
window.proceedToBooking = proceedToBooking;
window.loadCinemaTab = loadCinemaTab;
window.showMoviesInCinema = showMoviesInCinema;
window.backToCinemas = backToCinemas;
window.toggleProfile = toggleProfile;
window.handleLogout = handleLogout;
window.groupTicketsBySchedule = groupTicketsBySchedule;
window.renderGroupedTickets = renderGroupedTickets;
window.loadUserTickets = loadUserTickets;
window.showBookings = showBookings;
window.getUserDetails = getUserDetails;
window.cancelTicket = cancelTicket;
window.updateSidebarUserInfo = updateSidebarUserInfo;
