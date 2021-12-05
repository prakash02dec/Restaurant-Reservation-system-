var loginStatus = loginStat;

if (loginStatus === 1){
  $(".btn-sign").hide();
  $(".profile-pic").show();
  $(".profile-name").show();
}
else{
  $(".btn-sign").show();
  $(".profile-pic").hide();
  $(".profile-name").hide();
}
