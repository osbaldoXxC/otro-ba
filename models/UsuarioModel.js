const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true, 
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefono: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  image_url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'usuarios'
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario;
