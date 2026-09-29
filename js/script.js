// ===== Accounts (demo only) =====
// This site has no server, so accounts are saved in this browser's localStorage.
// That is fine for a class project, but it is NOT real security.
var DEMO_USER = { name: "Demo User", email: "demo@stream.com", password: "demo1234" };

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("users")) || [];
  } catch (e) {
    return [];
  }
}

function findUser(email) {
  email = email.trim().toLowerCase();
  if (email === DEMO_USER.email) return DEMO_USER;
  return getUsers().find(function (user) { return user.email === email; }) || null;
}

function getLoggedInUser() {
  var email = localStorage.getItem("loggedInUser");
  return email ? findUser(email) : null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(id, text) {
  var box = document.getElementById(id);
  box.textContent = text;
  box.style.display = text ? "block" : "none";
}

// Pages with data-protected on <body> need you to be signed in.
// The sign in / sign up pages send you to the home page if you already are.
function checkLogin() {
  var user = getLoggedInUser();
  if (document.body.hasAttribute("data-protected") && !user) {
    window.location.replace("index.html");
  } else if (document.getElementById("signin-form") && user) {
    window.location.replace("home.html");
  }
}
checkLogin();

// Sign in page: check the email and password, then go to the home page
function setupSignIn() {
  var form = document.getElementById("signin-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    if (email === "") return showMessage("signin-message", "Please enter your email.");
    if (!isValidEmail(email)) return showMessage("signin-message", "Please enter a valid email address.");
    if (password === "") return showMessage("signin-message", "Please enter your password.");

    var user = findUser(email);
    if (!user) return showMessage("signin-message", "No account found with this email. Please sign up first.");
    if (user.password !== password) return showMessage("signin-message", "Incorrect password. Please try again.");

    localStorage.setItem("loggedInUser", user.email);
    window.location.href = "home.html";
  });
}

// Sign up page: create the account, sign in, then choose a plan
function setupSignUp() {
  var form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim().toLowerCase();
    var password = document.getElementById("password").value;
    var confirm = document.getElementById("confirm-password").value;

    if (name === "") return showMessage("signup-message", "Please enter your name.");
    if (!isValidEmail(email)) return showMessage("signup-message", "Please enter a valid email address.");
    if (findUser(email)) return showMessage("signup-message", "An account with this email already exists. Please sign in.");
    if (password.length < 4 || password.length > 40) {
      return showMessage("signup-message", "Your password must contain between 4 and 40 characters.");
    }
    if (password !== confirm) return showMessage("signup-message", "Passwords do not match.");

    var users = getUsers();
    users.push({ name: name, email: email, password: password });
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("loggedInUser", email);
    window.location.href = "subscribe.html";
  });
}

// Profile icon in the navbar signs you out
function setupSignOut() {
  var profile = document.querySelector(".navbar .profile");
  var user = getLoggedInUser();
  if (!profile || !user) return;
  profile.title = "Signed in as " + user.name + " - click to sign out";
  profile.addEventListener("click", function () {
    localStorage.removeItem("loggedInUser");
  });
}

// Sign in / sign up pages: show / hide the password
function togglePassword() {
  ["password", "confirm-password"].forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  });
}

// Subscription page: fill in the price when a plan is picked,
// then go to the Debit or Credit page that was selected
function setupSubscribeForm() {
  var form = document.getElementById("subscribe-form");
  if (!form) return;

  var prices = { Mobile: 199, Basic: 499, Standard: 649, Premium: 799 };
  var plan = document.getElementById("plan");
  var amount = document.getElementById("amount");

  plan.addEventListener("change", function () {
    amount.value = prices[plan.value] ? "Rs." + prices[plan.value] : "";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var mode = form.querySelector('input[name="payment"]:checked').value;
    window.location.href = mode === "credit" ? "credit.html" : "debit.html";
  });
}

// Navbar search: on the home page, hide rows whose title doesn't match.
// On other pages, go to the home page and search there.
function setupSearch() {
  var form = document.getElementById("search-form");
  if (!form) return;
  var input = form.querySelector("input");
  var rows = document.querySelectorAll(".row");

  var params = new URLSearchParams(window.location.search);
  if (params.get("q") && rows.length) {
    input.value = params.get("q");
    filterRows(input.value, rows);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (rows.length) {
      filterRows(input.value, rows);
    } else {
      window.location.href = "home.html?q=" + encodeURIComponent(input.value);
    }
  });

  input.addEventListener("input", function () {
    if (rows.length) filterRows(input.value, rows);
  });
}

function filterRows(text, rows) {
  var query = text.trim().toLowerCase();
  var shown = 0;
  rows.forEach(function (row) {
    var title = row.querySelector(".row-title").textContent.toLowerCase();
    var match = query === "" || title.indexOf(query) !== -1;
    row.style.display = match ? "" : "none";
    if (match) shown++;
  });
  var empty = document.querySelector(".no-results");
  if (empty) empty.style.display = shown ? "none" : "block";
}

// Posters that load from other websites can disappear over time.
// Hide any poster that fails to load instead of showing a broken image.
function hideBrokenPosters() {
  document.querySelectorAll(".poster-row img, .episode img").forEach(function (img) {
    function hide() {
      if (img.closest(".poster-row")) img.parentElement.style.display = "none";
      else img.style.visibility = "hidden";
    }
    if (img.complete && img.naturalWidth === 0) hide();
    img.addEventListener("error", hide);
  });
}

// ===== Video =====
// Plays the local file videos/trailer.mp4. If that file isn't there,
// the YouTube trailer is used instead.
var LOCAL_VIDEO = "videos/trailer.mp4";
var YOUTUBE_ID = "BmVmhjjkN4E";

function useYouTube() {
  document.querySelectorAll("video[data-youtube]").forEach(function (video) {
    var frame = document.createElement("iframe");
    frame.className = video.className;
    frame.src = "https://www.youtube.com/embed/" + YOUTUBE_ID + (video.autoplay ? "?autoplay=1" : "");
    frame.title = "The Vampire Diaries Season 1 Trailer";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    video.replaceWith(frame);
  });

  // A YouTube video can't be downloaded, so the Download buttons open YouTube instead
  document.querySelectorAll("a.video-download").forEach(function (link) {
    link.href = "https://www.youtube.com/watch?v=" + YOUTUBE_ID;
    link.removeAttribute("download");
    link.target = "_blank";
    link.rel = "noopener";
    link.querySelector(".label").textContent = link.dataset.youtubeLabel;
    link.querySelector(".fa").className = "fa fa-youtube-play";
  });
}

function setupVideo() {
  if (!document.querySelector("video[data-youtube], a.video-download")) return;
  var probe = document.createElement("video");
  probe.preload = "metadata";
  probe.addEventListener("error", useYouTube);
  probe.src = LOCAL_VIDEO;
}

document.addEventListener("DOMContentLoaded", function () {
  setupVideo();
  hideBrokenPosters();
  setupSignIn();
  setupSignUp();
  setupSignOut();
  setupSubscribeForm();
  setupSearch();
});
