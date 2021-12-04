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

const app = express();

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
  name: String,
  address :String,
  ratings : String,
  phone : String,
  userReview : [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

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
  res.render("home");
});

app.get("/selectcity", function (req, res) {
  res.render("selectcity")
})

app.post("/selectcity", function (req, res) {
  console.log(req.body)
  res.render("restaurantcity", { cityname: req.body.city })
})

app.get('/auth/google', passport.authenticate('google', { scope: ["email", "profile"] }));

app.get('/auth/google/resdine',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/selectcity");
  });

app.get("/signup", function (req, res) {
  res.render("signup");
})

// app.post("/signup",function(req , res){
//   console.log(req.body)
// })
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
  res.render("login");
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

app.listen(3000, function () {
  console.log("Server running on Port 3000");
})
