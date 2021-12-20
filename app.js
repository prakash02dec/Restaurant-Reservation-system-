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
const cors = require('cors')
const app = express();
const multer  = require("multer")
const path = require("path")
const PORT = process.env.PORT || '3000';
const URL = process.env.URL || "http://localhost:" + PORT;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads")
  },
  filename: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    let extname = path.extname(
      file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9 )
    cb(null, file.fieldname + '-' + uniqueSuffix + extname)
  }
})
const maxSize = 1 * 1000 * 1000;

const upload = multer({ storage: storage ,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb){

      // Set the filetypes, it is optional
      const filetypes = /jpeg|jpg|png/;
      let mimetype = filetypes.test(file.mimetype);

      let extname = filetypes.test(path.extname(
                  file.originalname).toLowerCase());

      if (mimetype && extname) {
          return cb(null, true);
      }

      cb("Error: File upload only supports the "
              + "following filetypes - " + filetypes);
    } }).single("avatar")

app.use(cors({ origin: '*' }))
const checksum_lib = require('./public/Paytm/checksum');

const PaytmConfig = {
  mid: process.env.MERCHANT_ID,
  key: process.env.MERCHANT_KEY,
  website: process.env.WEBSITE
}
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session())
mongooseLink = "mongodb+srv://" + process.env.ATLAS_USER_ID + ":" + process.env.ATLAS_USER_PASSWORD + "@cluster0.0vjgs.mongodb.net/ResDine";
mongoose.connect(mongooseLink);

const suggestionSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String
})

const orderSchema = new mongoose.Schema({
  guests: Number,
  resTime: String,
  resDate: Date,
  resName: String,
  resId: String,
  userID: String,
  price: Number
})

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  address: String,
  password: String,
  googleId: String,
  phone: String,
  gender: String,
  photourl: String,
});

const cityRestuarantSchema = new mongoose.Schema({
  city: String,
  name: String,
  address: String,
  ratings: String,
  phone: String,
  costfor: String,
  openFrom: String,
  openTill: String,
  description: String,
  menuImage: String,
  carouselImages: [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Suggestion = mongoose.model("Suggestion", suggestionSchema);
const User = mongoose.model("User", userSchema);
const cityRestuarant = mongoose.model("cityRestuarant", cityRestuarantSchema);
const Order = mongoose.model("Order", orderSchema);

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
  callbackURL: URL + "/auth/google/resdine",
},
  function (accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id, email: profile.emails[0].value, username: profile.displayName, name: profile.displayName}, function (err, user) {
      if(!err && user.photourl === undefined){
        user.photourl = profile.photos[0].value;
        user.save();
      }
      return cb(err, user);
    });
  }
));

function navRender(page, req, res) {
  if (req.isAuthenticated()) {
    res.render(page, {
      loginStatus: 1,
      profileName: req.user.name,
      profilePic: req.user.photourl,
      user: req.user
    })
  }
  else {
    res.render(page, {
      loginStatus: 0,
      profileName: 0,
      profilePic: 0,
      user: 0
    });
  }
}


app.get("/", function (req, res) {
  navRender("home", req, res);
});

app.get("/contactus", function (req, res) {
  navRender("contact_us", req, res);
});

app.post("/contactus", function (req, res) {
  sug = new Suggestion({
    name: req.body.name,
    email: req.body.email,
    message: req.body.message
  });

  sug.save();
  res.redirect("/");
});

app.get("/additional", function (req, res) {
  navRender("additional", req, res);
})

app.post("/additional", function (req, res) {
  User.findOneAndUpdate({ googleId: req.user.googleId }, { phone: req.body.phoneNo, address: req.body.addressTextarea }, { upsert: true }, function (err) {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect("/selectcity");
    }
  });
})

app.get('/auth/google', passport.authenticate('google', { scope: ["email", "profile"] }));

app.get('/auth/google/resdine',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    if (req.user.phone === undefined) {
      res.redirect("/additional");
    }
    else {
      res.redirect("/selectcity");
    }
  });

app.get("/signup", function (req, res) {
  navRender("signup", req, res);
})

app.post("/signup", function (req, res) {
  User.register({
    username: req.body.username,
    name: req.body.name,
    address: req.body.address,
    phone: req.body.number,
    gender: req.body.gender,
    email : req.body.username,
    password : req.body.password,
    photourl: "images/profile-default.jpg"
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
  navRender("login", req, res);
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
  navRender("selectcity", req, res);
})

app.post("/selectcity", function (req, res) {
  res.redirect("/restaurantcity/" + req.body.city);
})

app.get("/restaurantcity/:city", function (req, res) {
  const cityName = _.startCase(_.toLower(req.params.city));
  cityRestuarant.find({ city: cityName }, function (err, foundRestaurants) {
    if (err) {
      console(err);
    } else {
      if (req.isAuthenticated()) {
        res.render("restaurantcity", {
          loginStatus: 1,
          profilePic: req.user.photourl,
          profileName: req.user.name,
          city: cityName,
          restaurants: foundRestaurants
        });
      }
      else {
        res.render("restaurantcity", {
          loginStatus: 0,
          profilePic: 0,
          profileName: 0,
          city: cityName,
          restaurants: foundRestaurants
        });
      }
    }
  })
})


app.get("/restaurantpage/:name", function (req, res) {
  const restaurantName = req.params.name;

  cityRestuarant.findOne({ name: restaurantName }, function (err, foundRestaurant) {
    let savedres;
    if (foundRestaurant != null) {
      savedres = foundRestaurant;
    }

    if (err) {
      console(err);
    } else {
      if (req.isAuthenticated()) {
        res.render("restaurantpage", {
          loginStatus: 1,
          profilePic: req.user.photourl,
          profileName: req.user.name,
          restaurant: savedres
        });
      }
      else {
        res.render("restaurantpage", {
          loginStatus: 0,
          profilePic: 0,
          profileName: 0,
          restaurant: savedres
        });
      }
    }
  })
})

app.get("/profile", function (req, res) {
  if (req.isAuthenticated()) {
    Order.find({ userID: req.user._id }, function (err, order) {
      res.render("user_profile", {
        loginStatus: 1,
        profileName: req.user.name,
        profilePic: req.user.photourl,
        user: req.user,
        orders: order,
        updateStatusUser: "",
        updateStatusPassword: ""
      })
    })
  }
  else {
    res.redirect("/login")
  }
})

app.post('/upload', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log(err);
    }
    if(req.isAuthenticated()){
      if (req.file){
        req.user.photourl = "uploads/" + req.file.filename;
        req.user.save()
      }
      res.redirect("/profile")
    }else{
      res.redirect("/login")
    }
  })
})

app.post("/editUser", function (req, res) {
  if (req.isAuthenticated()) {
    req.user.name = req.body.name;
    req.user.phone = req.body.phone;
    req.user.email = req.body.email;
    req.user.address = req.body.address;
    req.user.save()
    Order.find({ userID: req.user._id }, function (err, order) {
      res.render("user_profile", {
        loginStatus: 1,
        profileName: req.user.name,
        profilePic: req.user.photourl,
        orders: order,
        user: req.user,
        updateStatusUser: "Updated Sucessfully",
        updateStatusPassword: ""
      })
    })

  }
  else {
    res.redirect("/login")
  }
})

app.post("/editPassword", function (req, res) {

  if (req.isAuthenticated()) {
    if (req.user.password === undefined || req.user.password === req.body.old-password) {
      req.user.password = req.body.new-password;
      req.user.save()
      Order.find({ userID: req.user._id }, function (err, order) {
        res.render("user_profile", {
          loginStatus: 1,
          profileName: req.user.name,
          profilePic: req.user.photourl,
          orders: order,
          user: req.user,
          updateStatusUser: "",
          updateStatusPassword: "Updated Sucessfully"
        })
      })
    }
    else {
      Order.find({ userID: req.user._id }, function (err, order) {
        res.render("user_profile", {
          loginStatus: 1,
          profileName: req.user.name,
          profilePic: req.user.photourl,
          orders: order,
          user: req.user,
          updateStatusUser: "",
          updateStatusPassword: "Old Password invalid"
        })
      })
    }
  }
  else {
    res.redirect("/login")
  }
})


app.post("/revieworder/:resId", function (req, res) {
  let newOrder = new Order();
  if (req.isAuthenticated()) {
    let guests = req.body.guests;
    let resDate = req.body.bookingDate;
    let resTime = req.body.time;
    let resId = req.params.resId;
    let price = guests * 50;

    cityRestuarant.findOne({ _id: resId }, function (err, foundRestaurant) {
      newOrder = new Order({
        guests: guests,
        resDate: resDate,
        resTime: resTime,
        resName: foundRestaurant.name,
        userID: req.user._id,
        resId: resId,
        price: price
      });

      res.render("review_order", {
        loginStatus: 1,
        profileName: req.user.name,
        profilePic: req.user.photourl,
        user: req.user,
        restaurant: foundRestaurant,
        guests: guests,
        resDate: resDate,
        resTime: resTime,
        price: price,
        orderid: newOrder._id
      });
      newOrder.save();
    });

  }
  else {
    res.redirect("/login");
  }
});

app.post("/paynow", function (req, res) {
  var params = {};
  params["MID"] = PaytmConfig.mid;
  params["WEBSITE"] = PaytmConfig.website;
  params["CHANNEL_ID"] = "WEB";
  params["INDUSTRY_TYPE_ID"] = "Retail";
  // make sure that orderid be unique all time
  params["ORDER_ID"] = req.body.orderID;
  params["CUST_ID"] = "Customer001";
  // Enter amount here eg. 100.00 etc according to your need
  params["TXN_AMOUNT"] = req.body.price;
  params["CALLBACK_URL"] = URL + "/callback";
  // here you have to write customer"s email
  params["EMAIL"] = req.user.email;
  // here you have to write customer's phone number
  params['MOBILE_NO'] = req.user.phone;

  checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

    var txn_url = "https://securegw-stage.paytm.in/order/process"; // for staging
    var form_fields = "";
    for (var x in params) {
      form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
    }
    form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

    res.writeHead(200, { 'Content-Type': 'text/html' });
    var x = '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
    res.write(x);
    res.end();
  });

})

app.post('/callback', (req, res) => {
  let data = req.body ;
  let restaurantName ;
  Order.findById(data.ORDERID, function (err, foundOrder) {
    if (err)
      console.log(err)
    else {
      restaurantName = foundOrder.resName

      if (req.isAuthenticated())
        if (data.STATUS == "TXN_SUCCESS") {
          res.render("payment", {
            loginStatus: 1,
            profilePic: req.user.photourl,
            profileName: req.user.name,
            ORDER_ID: data.ORDERID,
            AMOUNT: data.TXNAMOUNT,
            CURRENCY: data.CURRENCY,
            BANK_NAME: data.BANKNAME,
            DATE_AND_TIME: data.TXNDATE,
            restaurantName: restaurantName,
            TXNID : data.TXNID,
            success: true
          });
        }
        else {
          res.render("payment", {
            loginStatus: 1,
            profilePic: req.user.photourl,
            profileName: req.user.name,
            ORDER_ID: data.ORDERID,
            AMOUNT: data.TXNAMOUNT,
            CURRENCY: data.CURRENCY,
            BANK_NAME: data.BANKNAME,
            DATE_AND_TIME: data.TXNDATE,
            restaurantName: restaurantName,
            TXNID : data.TXNID,
            success: false
          });
          Order.deleteOne({ _id: data.ORDERID }, function (err) {
            if (err)
              console.log(err)
          })
        }
    }

  })


})

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});
