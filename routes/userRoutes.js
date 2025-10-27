const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { registerUser, verificarRegistro2FA, reenviarRegistro2FA } = require("../controllers/userController");
const router = express.Router();

router.post("/register", registerUser); // tu ruta original intacta

// --- RUTAS 2FA AGREGADAS ---
router.post("/register/2fa/verificar", verificarRegistro2FA);
router.post("/register/2fa/reenviar", reenviarRegistro2FA);

// --- RUTAS DE GOOGLE OAUTH ---
// Ruta para iniciar autenticación con Google
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Callback de Google OAuth
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    try {
      // Generar JWT token
      const token = jwt.sign(
        {
          id: req.user._id,
          email: req.user.email,
          rol: req.user.rol,
        },
        process.env.JWT_SECRET || "secreto",
        { expiresIn: "7d" }
      );

      // Redirigir al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Error en callback de Google:", error);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`);
    }
  }
);

// Ruta para obtener información del usuario autenticado
router.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: req.user,
    });
  } else {
    res.status(401).json({
      success: false,
      message: "No autenticado",
    });
  }
});

// Ruta de logout
router.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error al cerrar sesión",
      });
    }
    res.json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  });
});

module.exports = router;
