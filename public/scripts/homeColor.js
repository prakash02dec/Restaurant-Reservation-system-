
if (window.location.href === "http://localhost:3000/" || window.location.href === "http://localhost:3000/#feature") {
  $("#home-btn").addClass("_active");
} else {
  $("#home-btn").removeClass("_active");
}
