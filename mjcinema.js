async function authData(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json(); // gets the result in json form
    if (response.ok) {
      return { success: true, data: result }; //will be true if the status code is 200 - 299
    } else {
      return { success: false, message: result.message || "An error occurred" }; // if not, the success will be false
    }
  } catch (error) {
    return { success: false, message: "Server is offline. Try again later." }; // handles connection error
  }
}
function showPopup(message, color) {
  const popup = document.getElementById("status-popup");

  popup.classList.remove("popup-green", "popup-red");

  popup.innerText = message;

  // We use the "green" label to decide which CSS class to add
  if (color === "green") {
    popup.classList.add("popup-green");
  } else if (color === "red") {
    popup.classList.add("popup-red");
  }
  popup.classList.add("show");

  // 4. Auto-hide after 3 seconds
  setTimeout(() => {
    popup.classList.remove("show");
  }, 3000);
}

function showError(msg) {
  const feedback = document.getElementById("auth-feedback");
  const container = document.querySelector(".login-container");

  feedback.innerText = msg;
  feedback.className = "feedback-visible error-vibe"; // Swaps to our floating box

  // Add the shake to the container for impact
  container.classList.add("shake");
  setTimeout(() => container.classList.remove("shake"), 400);

  // AUTO-HIDE after 3 seconds so they can type again
  setTimeout(() => {
    feedback.className = "feedback-hidden";
  }, 3000);
}

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
}

function closeModal() {
  const modal = document.getElementById("movie-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // Re-enable background scrolling
  }
} // this is for closing the popup.
// 4. EVENT LISTENERS
const registerBtn = document.querySelector("#register-button"); // use . for classes
//shows that its an id with #

if (registerBtn) {
  registerBtn.addEventListener("click", async (e) => {
    // STOP the form from submitting to a server (for now)
    e.preventDefault();

    const feedback = document.getElementById("auth-feedback");
    if (feedback.classList.contains("feedback-visible")) {
      feedback.className = "feedback-hidden";
    }
    // 3. GET the data
    const user = document.querySelector("#reg-username").value;
    const pass = document.querySelector("#reg-password").value; // to get the value
    const con = document.querySelector("#confirm-password").value;
    const registerData = {
      username: user,
      password: pass,
      confirm: con,
    };

    if (pass !== con) {
      showError("Passwords do not match."); //uses the showError function which will have a popup red feedback
      return; //compares the two entered password which should be the same
    }
    const count = pass.length;
    if (count < 8) {
      showError("Password length should be more than 8 characters.");
      return;
    } //passwords should be more thann 8 characters
    const result = await authData(
      "http://localhost:8080/user/register",
      registerData
    ); //result will be the data fetched from the endpoint

    if (result.success) {
      showPopup("Account Created. Redirecting...", "green");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000); //shows the popup for 2 seconds
    } else {
      showPopup("Server is offline. Try again later.", "red");
    }
  });
}

const loginBtn = document.querySelector("#login-button");
if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const feedback = document.getElementById("auth-feedback");
    if (feedback.classList.contains("feedback-visible")) {
      feedback.className = "feedback-hidden";
    }

    const user = document.querySelector("#username").value;
    const pass = document.querySelector("#password").value; // get value

    const loginCred = {
      username: user,
      password: pass,
    };

    const result = await authData(
      "http://localhost:8080/user/login",
      loginCred
    );

    if (result.success) {
      localStorage.setItem("userId", result.data.userId); //stores the userID and password of the user logged in
      localStorage.setItem("username", result.data.username); //this will be used for future transactions of the user.
      showPopup(result.message, "green");
      window.location.href = "dashboard.html";
    } else if (result.message === "Server is offline. Try again later.") {
      showPopup("Server is offline. Try again later.", "red");
    } else {
      showError("Invalid Username or Password.");
    }
  });
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
