import * as xlsx from 'xlsx';
import fs from 'fs';

const data = [
  {
    "ID": "",
    "Nombre": "Maki Especial",
    "Categoría": "Alimentos",
    "Subcategoría": "Makis",
    "Precio Mostrador": 100,
    "Precio Uber": 120,
    "Precio DiDi": 115,
    "Estado": "Activo",
    "Disponible Hoy": "Sí",
    "Promoción": "-30%",
    "Permite Canje": "Sí",
    "Puntos Requeridos": 50
  },
  {
    "ID": "",
    "Nombre": "Limonada",
    "Categoría": "Bebidas",
    "Subcategoría": "Bebidas Frías",
    "Precio Mostrador": 30,
    "Precio Uber": 40,
    "Precio DiDi": 38,
    "Estado": "Inactivo",
    "Disponible Hoy": "Sí",
    "Promoción": "Sin promoción",
    "Permite Canje": "No",
    "Puntos Requeridos": 0
  }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(wb, ws, "Productos");

xlsx.writeFile(wb, "Base_Maestra_DelightOS_v2.0.xlsx");
console.log("Mock Excel created.");
