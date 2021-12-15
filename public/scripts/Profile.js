$(".userDetails").show()
$(".editUserDetails").hide()

$(".profile-btn").on("click" , function(){
    $(".userDetails").hide()
    $(".editUserDetails").show()
});

$(".back-btn").on("click" , function(){
    $(".userDetails").show()
    $(".editUserDetails").hide()
});