import { UI } from "./ui.js";
import { Auth } from "./auth.js";

const authApp = new Auth(); //automatically does what the function sayss
const ui = new UI(); //imports UI and instantiates

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
    const response = await fetch(url);
    const data = await response.json();

    // Force it onto the window object explicitly
    window.allMovies = Array.from(data);
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

const movieId = localStorage.getItem("movieId");

//for booking
async function proceedToBooking(movieId) {
  const baseUrl = "http://localhost:8080";
  const bookBtn = document.querySelector(".book-btn-modal");
  if (bookBtn) {
    try {
      const response = await fetch(
        `${baseUrl}/schedule/movieSchedules/${movieId}`
      );

      if (!response.ok) {
        console.log("unable to fetch schedules");
      }

      const schedules = await response.json();

      renderScheduleSelection(schedules);
    } catch (e) {
      console.error("Error:", e);
    }
  }
}
function renderScheduleSelection(schedules) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = `<h3>Select a Showtime</h3>`;

  // 1. Create the dropdown (select) element
  const select = document.createElement("select");
  select.id = "showtime-dropdown";
  select.className = "schedule-dropdown";

  // 2. Add a default "Choose" option
  const defaultOpt = document.createElement("option");
  defaultOpt.text = "-- Choose a showtime --";
  defaultOpt.value = "";
  select.appendChild(defaultOpt);

  // 3. Fill the dropdown with schedules
  schedules.forEach((sched) => {
    const option = document.createElement("option");
    option.value = sched.id; // The ID we need for booking
    option.text = `${sched.showDate} | ${sched.startTime} - ${sched.cinema.location}`;
    select.appendChild(option);
  });

  // 4. Create a "Proceed" button
  const proceedBtn = document.createElement("button");
  proceedBtn.innerText = "Select Seats";
  proceedBtn.className = "confirm-sched-btn";

  proceedBtn.onclick = () => {
    const selectedId = select.value;
    if (!selectedId) {
      alert("Please select a time slot first!");
      return;
    }
    // Save and redirect
    localStorage.setItem("selectedScheduleId", selectedId);
    window.location.href = "bookseat.html";
  };

  container.appendChild(select);
  container.appendChild(proceedBtn);
}
const nowShowing = document.getElementById("now-showing");
const comingSoon = document.getElementById("coming-soon");

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

window.ClickedCardHandler = ClickedCardHandler;
window.closeModal = closeModal;
window.loadMovies = loadMovies;
// Add this at the very bottom of your file
window.proceedToBooking = proceedToBooking;
