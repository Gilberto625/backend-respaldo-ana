require("dotenv").config(); // Cargar variables de entorno PRIMERO
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const conectarDB = require("./config/db");

// Importar las rutas
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = process.env.PORT || 4000;

// ===== AGREGADO: configurar origen permitido desde .env =====
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Middleware para parsear JSON y habilitar CORS
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Configuración de sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true en producción con HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Conectar a la base de datos
conectarDB();

// ===== AGREGADO: ruta de salud/diagnóstico =====
app.get("/", (_req, res) => {
  res.send("API OK");
});

// Rutas API existentes
app.use("/api/usuarios", userRoutes);

// Iniciar servidor
app.listen(port, () => {
  // ===== CORREGIDO: usar template literal para ver el puerto correctamente =====
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
