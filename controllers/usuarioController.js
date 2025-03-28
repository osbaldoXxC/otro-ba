const Usuario = require('../models/UsuarioModel');
const cloudinary = require('../config/cloudinaryConfig');
const nodemailer = require('nodemailer');
const axios = require('axios'); // Para hacer peticiones HTTP

// Configurar el transporte de Nodemailer con Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar si el correo es válido con MailboxLayer
const verifyEmail = async (email) => {
  try {
    const response = await axios.get(`https://apilayer.net/api/check`, {
      params: {
        access_key: process.env.MAILBOXLAYER_API_KEY,
        email: email,
        format: '1', // Formato JSON
      },
    });

    const { smtp_check, is_valid } = response.data;

    if (!response.data.format_valid || !response.data.mx_found || response.data.disposable) {
      return false;
    }    

    return true;
  } catch (error) {
    return false;
  }
};

const registerUser = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, password } = req.body;

    // Verificar formato básico del correo
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El correo electrónico tiene un formato inválido' });
    }

    // Verificar si el correo existe usando MailboxLayer
    const isEmailValid = await verifyEmail(email);
    if (!isEmailValid) {
      return res.status(400).json({ message: 'El correo electrónico no existe o no es válido' });
    }

    // Verificar si el correo ya está registrado
    const existingUser = await Usuario.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Imagen no proporcionada' });
    }

    // Subir imagen a Cloudinary
    const imageStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(imageStr, {
      folder: 'usuarios',
      resource_type: 'auto'
    });

    // Crear el nuevo usuario
    const newUser = new Usuario({
      nombre,
      apellido,
      email,
      telefono,
      password,
      image_url: uploadResult.secure_url
    });

    await newUser.save();

    // Enviar correo de confirmación a través de Mailtrap
    const mailOptions = {
      from: process.env.SMTP_USER, // Correo desde el cual se enviará
      to: email, // Correo del usuario registrado
      subject: "Registro exitoso",
      text: `Hola ${nombre},\n\nTu cuenta ha sido creada exitosamente.\n\nSaludos,\nEquipo de Soporte`,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    return res.status(201).json({ message: 'Usuario registrado y correo enviado', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

module.exports = { registerUser };
