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
    if(count < 8){
        showError("Password length should be more than 8 characters.")
        return
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
      showPopup(result.message, "green");
      window.location.href = "dashboard.html";
    } else  if(result.message === "Server is offline. Try again later."){
        showPopup("Server is offline. Try again later.", "red");
    }
    else{
        showError("Invalid Username or Password.")
    }
  });
}
