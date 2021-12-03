require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const cheerio = require('cheerio');

// const session = require("express-session");
// const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get("/", function(req, res){
  res.render("home/index");
});

app.get("/signup", function(req, res){
  res.render("signup/index");
})

app.get("/login", function(req, res){
  res.render("login/index");

})

app.listen(3000, function(){
  console.log("Server running on Port 3000");
})
