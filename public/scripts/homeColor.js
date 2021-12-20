$("#home-btn").removeClass("_active");
$("#contactus-btn").removeClass("_active");
$("#booktable-btn").removeClass("_active");

if (window.location.href === "http://localhost:3000/" || window.location.href === "http://localhost:3000/#feature" || window.location.href === "https://resdine.herokuapp.com/" || window.location.href === "https://resdine.herokuapp.com/#feature") {
  $("#home-btn").addClass("_active");
}
else if (window.location.href === "http://localhost:3000/contactus" || window.location.href === "https://resdine.herokuapp.com/contactus"){
  $("#contactus-btn").addClass("_active");
}
else if (window.location.href === "http://localhost:3000/selectcity" || window.location.href === "https://resdine.herokuapp.com/selectcity"){
  $("#booktable-btn").addClass("_active");
}
