import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const fileName = 'Base_Maestra_DelightOS_v2.0.xlsx';
const filePath = path.join(process.cwd(), fileName);

if (!fs.existsSync(filePath)) {
  console.error(`ERROR: El archivo ${fileName} no se encuentra en el directorio principal.`);
  process.exit(1);
}

console.log(`=== INICIANDO VALIDACIÓN OPERATIVA ===\n`);
console.log(`Leyendo archivo: ${fileName}...`);

try {
  const buffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(buffer);
  
  if (!workbook.SheetNames.includes('Productos')) {
    console.error("ERROR: No se encontró la pestaña 'Productos' en el archivo Excel.");
    process.exit(1);
  }

  const sheet = workbook.Sheets['Productos'];
  const rows = xlsx.utils.sheet_to_json<any>(sheet);

  console.log(`\n1. VALIDACIÓN DEL ARCHIVO`);
  console.log(`- Número total de productos detectados: ${rows.length}`);

  const categories = new Set<string>();
  const subCategories = new Set<string>();
  const productIds = new Set<string>();
  const productNames = new Set<string>();
  
  let duplicateIds = 0;
  let duplicateNames = 0;
  let missingMostrador = 0;
  let missingUber = 0;
  let missingDidi = 0;
  let inactiveProducts = 0;
  let notAvailableToday = 0;
  let withPromotion = 0;
  let withReward = 0;
  let missingImage = 0;

  rows.forEach((row, idx) => {
    const id = row['ID'] || `temp-${idx}`;
    const name = row['Nombre'] || 'Desconocido';
    const cat = row['Categoría'] || 'General';
    const subCat = row['Subcategoría'] || '';
    
    categories.add(cat);
    if (subCat) subCategories.add(subCat);

    if (productIds.has(id)) duplicateIds++;
    productIds.add(id);

    if (productNames.has(name.toLowerCase())) duplicateNames++;
    productNames.add(name.toLowerCase());

    const precioMostrador = Number(row['Precio Mostrador']);
    const precioUber = Number(row['Precio Uber']);
    const precioDidi = Number(row['Precio DiDi']);

    if (isNaN(precioMostrador) || precioMostrador <= 0) missingMostrador++;
    if (isNaN(precioUber) || precioUber <= 0) missingUber++;
    if (isNaN(precioDidi) || precioDidi <= 0) missingDidi++;

    if (row['Estado'] === 'Inactivo') inactiveProducts++;
    if (row['Disponible Hoy'] === 'No') notAvailableToday++;
    
    const promo = row['Promoción'];
    if (promo && promo !== 'Sin promoción') withPromotion++;

    if (row['Permite Canje'] !== 'No') withReward++;
    if (!row['Imagen']) missingImage++;
  });

  console.log(`- Categorías detectadas: ${categories.size} (${Array.from(categories).join(', ')})`);
  console.log(`- Subcategorías detectadas: ${subCategories.size}`);
  console.log(`- IDs duplicados: ${duplicateIds}`);
  console.log(`- Productos duplicados (por nombre): ${duplicateNames}`);
  console.log(`- Productos sin precio de Mostrador: ${missingMostrador}`);
  console.log(`- Productos sin precio de Uber: ${missingUber}`);
  console.log(`- Productos sin precio de DiDi: ${missingDidi}`);
  console.log(`- Productos inactivos: ${inactiveProducts}`);
  console.log(`- Productos no disponibles hoy: ${notAvailableToday}`);
  console.log(`- Productos con promoción: ${withPromotion}`);
  console.log(`- Productos con canje habilitado: ${withReward}`);
  console.log(`- Productos sin imagen: ${missingImage}`);

  console.log(`\n==================================================`);
  console.log(`ESPERANDO IMPORTACIÓN REAL...`);
  console.log(`El script de validación está listo para ejecutar la inserción a Supabase, IndexedDB y React State una vez que confirmemos que el archivo se ha subido correctamente.`);
  
} catch (error) {
  console.error("Error al procesar el archivo Excel:", error);
}
