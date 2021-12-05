require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const _ = require("lodash")

const app = express();

var loginStatus = 0;
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session())

mongoose.connect("mongodb://127.0.0.1:27017/resdineDB");
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  address: String,
  password: String,
  googleId: String,
  phone: String,
  gender: String,
  photourl: String
});

const cityRestuarantSchema = new mongoose.Schema({
  city : String,
  name: String,
  address :String,
  ratings : String,
  phone : String,
  costfor : String,
  openfrom : String,
  userReview : [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const cityRestuarant = mongoose.model("cityRestuarant", cityRestuarantSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/resdine",
  },
  function (accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    User.findOrCreate({ googleId: profile.id, username: profile.emails[0].value, name: profile.displayName, photourl: profile.photos[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function (req, res) {
  res.render("home", {
    loginStatus: loginStatus
  });
});

app.get('/auth/google', passport.authenticate('google', { scope: ["email", "profile"] }));

app.get('/auth/google/resdine',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    loginStatus = 1;
    res.redirect("/selectcity");
  });

app.get("/signup", function (req, res) {
  res.render("signup", {
    loginStatus: loginStatus
  });
})

app.post("/signup", function (req, res) {
  User.register({
    username: req.body.username,
    name: req.body.name,
    address: req.body.address,
    phone: req.body.number,
    gender: req.body.gender
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/signup");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/selectcity")
      })
    }
  })
})

app.get("/login", function (req, res) {
  res.render("login", {
    loginStatus: loginStatus
  });
})

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, function (err) {
    if (err) { console.log(err) }
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/selectcity")
      })
    }
  })
})

app.get("/selectcity", function (req, res) {
  res.render("selectcity", {
    loginStatus: loginStatus
  })
})

app.post("/selectcity", function (req, res) {
  res.redirect("/restaurantcity/"+req.body.city);
})

app.get("/restaurantcity/:city", function(req,res){
  const cityName = _.capitalize(req.params.city)

  cityRestuarant.find({city : cityName},function(err, foundRestaurants){
    if(err){
      console(err);
    }else{
      res.render("restaurantcity", { restaurants : foundRestaurants, loginStatus : loginStatus });
    }
  })
})

app.get("/restaurantpage/:name",function(req,res){
    const restaurantName = req.params.name
    cityRestuarant.findOne({name : restaurantName},function(err, foundRestaurant){
      if(err){
        console(err);
      }else{
        res.render("restaurantpage", { restaurant : foundRestaurant, loginStatus : loginStatus });
      }
    })
})

app.listen(3000, function () {
  console.log("Server running on Port 3000");
})
