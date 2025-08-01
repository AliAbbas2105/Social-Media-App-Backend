const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('../models/user');
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
}, async function (request, accessToken, refreshToken, profile, done) {
    try {
        // Check if user already exists in the database
        let user = await User.findOne({ email: profile.email });
        if (user) {
            if (user.provider !== 'google' || user.accountId !== profile.id) {
                user.provider = 'google';
                user.googleId = profile.id;
                await user.save();
                return done(null, user);
            }
        } else {
            // Create a new user
            user = new User({
                googleId: profile.id,
                username: profile.displayName,
                email: profile.email,
                provider: 'google',
                isVerified: true,
            });
            await user.save();
            return done(null, user);
        }
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}
));