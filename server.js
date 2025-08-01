const express = require('express')
const session = require('express-session');
const app = express()
const dotenv=require('dotenv')
dotenv.config()
const mongoose = require('mongoose')
const passport = require('passport');
const path = require('path');

const userRoutes=require('./routes/userRoutes')
const postRoutes=require('./routes/postRoutes')
const followRoutes = require('./routes/followRoutes');
const GoogleRoutes = require('./routes/googleRouter');
const User = require('./models/user');
require('./controllers/auth-google');

const PORT =process.env.PORT
const MONGODBLINK=process.env.MONGODBLINK

mongoose.connect(MONGODBLINK)
        .then(()=>{
            console.log('Connected to MongoDB');
        })
        .catch((error)=>{
            console.error('MongoDB connection error:', error);
        })

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
  const user = await User.findById(id);
  done(null, user);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.get('/', (req, res) => {
  res.render('homepage');
});

app.use('/auth', GoogleRoutes);
app.use('/post',postRoutes)
app.use('/follow', followRoutes);
app.use('/',userRoutes)

app.listen(PORT)