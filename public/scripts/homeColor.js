if (window.location.href === "http://localhost:3000/" || window.location.href === "http://localhost:3000/#feature" || window.location.href === "http://localhost:3000/#footer") {
  $("#home-btn").addClass("_active");
} else {
  $("#home-btn").removeClass("_active");
}
