const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Usuario = require("../models/Usuario");

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Usuario.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Estrategia de Google OAuth 2.0
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar si el usuario ya existe por googleId
        let usuario = await Usuario.findOne({ googleId: profile.id });

        if (usuario) {
          // Usuario ya existe, actualizar información si es necesario
          usuario.picture = profile.photos?.[0]?.value || usuario.picture;
          usuario.verificado = true; // Los usuarios de Google están verificados
          await usuario.save();
          return done(null, usuario);
        }

        // Verificar si existe un usuario con el mismo email
        usuario = await Usuario.findOne({ email: profile.emails[0].value });

        if (usuario) {
          // Usuario existe con el mismo email pero sin googleId
          // Vincular la cuenta de Google
          usuario.googleId = profile.id;
          usuario.picture = profile.photos?.[0]?.value || usuario.picture;
          usuario.provider = "google";
          usuario.verificado = true;
          await usuario.save();
          return done(null, usuario);
        }

        // Crear nuevo usuario
        const nuevoUsuario = new Usuario({
          googleId: profile.id,
          nombre: profile.displayName || profile.name.givenName,
          email: profile.emails[0].value,
          picture: profile.photos?.[0]?.value,
          provider: "google",
          verificado: true, // Los usuarios de Google están verificados automáticamente
        });

        await nuevoUsuario.save();
        done(null, nuevoUsuario);
      } catch (error) {
        console.error("Error en Google Strategy:", error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
