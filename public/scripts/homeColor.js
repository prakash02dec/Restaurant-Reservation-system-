
if (window.location.href === "http://localhost:3000/" || window.location.href === "http://localhost:3000/#feature" || window.location.href === "https://resdine.herokuapp.com/" || window.location.href === "https://resdine.herokuapp.com/") {
  $("#home-btn").addClass("_active");
} else {
  $("#home-btn").removeClass("_active");
}
