const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ap: { type: String, required: false }, // Opcional para usuarios de Google
  am: { type: String, required: false }, // Opcional para usuarios de Google
  username: { type: String, required: false, unique: true, sparse: true }, // Opcional para Google
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Opcional para usuarios de Google
  telefono: { type: String, required: false }, // Opcional para usuarios de Google
  preguntaSecreta: { type: String, required: false }, // Opcional para usuarios de Google
  respuestaSecreta: { type: String, required: false }, // Opcional para usuarios de Google
  rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
  verificado: { type: Boolean, default: false },
  // Campos para Google OAuth
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String }, // URL de la foto de perfil de Google
  provider: { type: String, enum: ["local", "google"], default: "local" }, // Proveedor de autenticación
}, { timestamps: true });

usuarioSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

usuarioSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

module.exports = Usuario;