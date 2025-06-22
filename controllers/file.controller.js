// controllers/file.controller.js
const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.upload = async (req, res) => {
  const { actividadId } = req.params;
  const filePath = req.file.path;
  const fileUrl = `/uploads/${req.file.filename}`;

  const archivo = await prisma.archivo.create({
    data: {
      url: fileUrl,
      descripcion: req.body.descripcion,
      actividad: { connect: { id: Number(actividadId) } },
    },
  });
  res.status(201).json(archivo);
};

exports.download = (req, res) => {
  const { filename } = req.params;
  const fullPath = path.join(__dirname, '../uploads', filename);
  res.download(fullPath);
};
