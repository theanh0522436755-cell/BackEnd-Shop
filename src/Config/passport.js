const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Users = require("./../Model/User");
require("dotenv").config(); // Fix: added parentheses to call the function

const configurePassport = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await Users.findOne({ email: profile.emails[0].value });
          if (!user) {
            user = await new Users({
              name: profile.displayName,
              email: profile.emails[0].value,
              password: "google-auth-" + Math.random().toString(36).slice(2),
              avatar: profile.photos[0].value,
            }).save();
          }
          return done(null, user);
        } catch (err) {
          console.error("Google strategy error:", err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await Users.findById(id);

      done(null, user);
    } catch (err) {
      console.error("Deserialize error:", err);
      done(err, null);
    }
  });
};

module.exports = configurePassport;
