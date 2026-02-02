async function authData(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, message: result.message || "An error occurred" };
    }
  } catch (error) {
    return { success: false, message: "Server is offline. Try again later." };
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
function openMovieDetails(movie) {
  const openMovie = document.getElementById("movie-modal");
  const imageBaseUrl = "https://image.tmdb.org/t/p/w500";
  //once the movie is tapped, it will show the modal
  openMovie.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <img src="${imageBaseUrl + movie.poster}">
            <h2>${movie.title}</h2>
            <p class="rating">⭐ ${movie.rating}</p>
            <p class="overview">${movie.overview}</p>
            <button onclick="proceedToBooking(${movie.id})">Book Seats</button>
        </div>
    `; //this will be the html of the movies that will be tapped by the user
  openMovie.style.display = "block";
}

//this is used to show the movies in grid form
async function loadMovies(url, type) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    window.allMovies = data; //saves all the movies here so that ClickedCardHandler can use it later.
    const grid = document.getElementById("movie-grid");

    if (!Array.isArray(data)) {
      console.error("Backend sent an object instead of a list:", data);
      grid.innerHTML = "<p>Unexpected data format from server.</p>";
      return;
    }
    // We use .map().join('') here because it's faster than innerHTML += in a loop
    const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

    grid.innerHTML = data
      .map(
        (movie) => `
      <div class="movie-card" onclick = "ClickedCardHandler(${movie.id})">
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

function ClickedCardHandler(movieId) {
  const movie = window.allMovies.find((m) => m.id === movieId); //finds the movie Id

  openMovieDetails(movie);
}
// 4. EVENT LISTENERS
const registerBtn = document.querySelector("#register-button"); // use . for classes
//shows that its an id with #

if (registerBtn) {
  // 2. LISTEN for the click
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
      showError("Passwords do not match.");
      return;
    }
    const count = pass.length;
    if (count < 8) {
      showError("Password length should be more than 8 characters.");
      return;
    }
    const result = await authData(
      "http://localhost:8080/user/register",
      registerData
    );

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
    loadMovies("http://localhost:8080/schedule/coming-soon", "soon");
  });
}
