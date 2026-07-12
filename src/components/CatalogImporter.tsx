import React, { useState, useRef } from 'react';
import * as xlsx from 'xlsx';
import { Product, Ingredient, ProductCategory, ProductRecipeItem, SalesChannel } from '../types';
import { X, Upload, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowRight, Save } from 'lucide-react';

interface CatalogImporterProps {
  onClose: () => void;
  existingProducts: Product[];
  existingIngredients: Ingredient[];
  onImportComplete: (newProducts: Product[], updatedProducts: Product[], newIngredients: Ingredient[]) => Promise<void>;
}

const normalizeHeader = (h: string) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_]/g, "");

const getFieldValue = (row: any, possibleNames: string[]) => {
  const normalizedNames = possibleNames.map(normalizeHeader);
  for (const key of Object.keys(row)) {
    if (normalizedNames.includes(normalizeHeader(key))) {
      return row[key];
    }
  }
  return undefined;
};

export default function CatalogImporter({ onClose, existingProducts, existingIngredients, onImportComplete }: CatalogImporterProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [parsedIngredients, setParsedIngredients] = useState<Ingredient[]>([]);
  
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [updatedProducts, setUpdatedProducts] = useState<{old: Product, new: Product}[]>([]);
  const [newIngredients, setNewIngredients] = useState<Ingredient[]>([]);
  
  const [parseErrors, setParseErrors] = useState<{row: number, msg: string}[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const [importOptions, setImportOptions] = useState({
    updateExisting: true,
    createNew: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseExcel(selected);
    }
  };

  const parseExcel = async (f: File) => {
    const data = await f.arrayBuffer();
    const workbook = xlsx.read(data);
    
    let products: Product[] = [];
    let ingredients: Ingredient[] = [];
    let errors: {row: number, msg: string}[] = [];

    if (workbook.SheetNames.includes('Productos')) {
      const sheet = workbook.Sheets['Productos'];
      const rows = xlsx.utils.sheet_to_json<any>(sheet);
      
      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const name = getFieldValue(row, ['producto', 'nombre', 'nombredelproducto', 'articulo', 'item']);
        if (!name || String(name).trim() === '') {
          errors.push({ row: rowNum, msg: 'Falta el nombre del producto en la columna Producto' });
          return;
        }

        products.push({
          id: row['ID'] || crypto.randomUUID(),
          name: String(name).trim(),
          category: row['Subcategoría'] || row['Categoría'] || 'General',
          mainCategory: row['Categoría'] || 'Alimentos',
          subCategory: row['Subcategoría'] || '',
          family: row['Familia'] || '',
          prices: {
            [SalesChannel.MOSTRADOR]: Number(row['Precio Mostrador']) || 0,
            [SalesChannel.UBER]: Number(row['Precio Uber']) || 0,
            [SalesChannel.DIDI]: Number(row['Precio DiDi']) || 0,
            [SalesChannel.ESPECIAL]: (Number(row['Precio Mostrador']) || 0) * 0.85,
            [SalesChannel.ONLINE_FUTURE]: Number(row['Precio Mostrador']) || 0,
          },
          originalPrice: Number(row['Precio Original']) || undefined,
          discountPrice: Number(row['Precio Descuento']) || undefined,
          description: row['Descripción'] || '',
          image_url: row['Imagen'] || undefined,
          active: row['Estado'] !== 'Inactivo',
          isAvailableToday: row['Disponible Hoy'] !== 'No',
          allowReward: row['Permite Canje'] !== 'No',
          rewardPoints: Number(row['Puntos Requeridos']) || undefined,
          promotionText: row['Promoción'] || undefined,
          recipe: []
        });
      });
    }

    if (workbook.SheetNames.includes('Insumos') || workbook.SheetNames.includes('Inventario')) {
      const sheetName = workbook.SheetNames.includes('Insumos') ? 'Insumos' : 'Inventario';
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<any>(sheet);

      rows.forEach((row, index) => {
        const name = getFieldValue(row, ['insumo', 'nombre', 'articulo', 'item']);
        if (!name || String(name).trim() === '') {
          return;
        }
        ingredients.push({
          id: row['ID'] || crypto.randomUUID(),
          name: String(name).trim(),
          stock: Number(row['Stock']) || 0,
          unit: row['Unidad'] || 'pz',
          minStock: Number(row['Stock Mínimo']) || 0,
          active: row['Estado'] !== 'Inactivo'
        });
      });
    }

    setParseErrors(errors);
    
    if (workbook.SheetNames.includes('Recetas')) {
      const sheet = workbook.Sheets['Recetas'];
      const rows = xlsx.utils.sheet_to_json<any>(sheet);
      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const productName = getFieldValue(row, ['producto', 'nombre producto']);
        const ingredientName = getFieldValue(row, ['insumo', 'ingrediente']);
        const qty = Number(getFieldValue(row, ['cantidad', 'qty', 'porción']));
        
        if (!productName || !ingredientName || isNaN(qty)) {
          errors.push({ row: rowNum, msg: 'Receta inválida: Faltan datos (Producto, Insumo, Cantidad)' });
          return;
        }
        
        const pMatch = products.find(p => p.name.toLowerCase() === String(productName).toLowerCase().trim()) || existingProducts.find(p => p.name.toLowerCase() === String(productName).toLowerCase().trim());
        const iMatch = ingredients.find(i => i.name.toLowerCase() === String(ingredientName).toLowerCase().trim()) || existingIngredients.find(i => i.name.toLowerCase() === String(ingredientName).toLowerCase().trim());
        
        if (!pMatch) {
          errors.push({ row: rowNum, msg: `Producto no encontrado para receta: ${productName}` });
          return;
        }
        if (!iMatch) {
          errors.push({ row: rowNum, msg: `Insumo no encontrado para receta: ${ingredientName}` });
          return;
        }
        
        // Ensure recipe array exists
        if (!pMatch.recipe) pMatch.recipe = [];
        pMatch.recipe.push({
          ingredientId: iMatch.id,
          quantity: qty
        });
      });
    }

    setParsedProducts(products);
    setParsedIngredients(ingredients);
    
    // Validation & diffing
    const toAdd: Product[] = [];
    const toUpdate: {old: Product, new: Product}[] = [];
    
    products.forEach(p => {
      const existing = existingProducts.find(ep => ep.id === p.id || ep.name.toLowerCase() === p.name.toLowerCase());
      if (existing) {
        toUpdate.push({ old: existing, new: { ...p, id: existing.id } });
      } else {
        toAdd.push({ ...p, id: crypto.randomUUID() });
      }
    });
    
    setNewProducts(toAdd);
    setUpdatedProducts(toUpdate);
    
    const ingsToAdd: Ingredient[] = [];
    ingredients.forEach(i => {
      const existing = existingIngredients.find(ei => ei.id === i.id || ei.name.toLowerCase() === i.name.toLowerCase());
      if (!existing) {
        ingsToAdd.push({ ...i, id: crypto.randomUUID() });
      }
    });
    
    setNewIngredients(ingsToAdd);
    setStep(2);
  };

  const confirmImport = async () => {
    setIsImporting(true);
    const finalNewProducts = importOptions.createNew ? newProducts : [];
    const finalUpdatedProducts = importOptions.updateExisting ? updatedProducts.map(u => u.new) : [];
    
    try {
      await onImportComplete(finalNewProducts, finalUpdatedProducts, newIngredients);
      setImportDone(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      alert("Hubo un error durante la importación. Por favor revisa la consola.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-delight-gray/10 flex justify-between items-center bg-[#FFFDF8]">
          <div>
            <h2 className="text-xl font-black text-delight-dark uppercase tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="text-delight-green w-6 h-6" />
              Importador Inteligente
            </h2>
            <p className="text-xs text-delight-gray mt-1">
              Carga tu catálogo Base Maestra DelightOS v2.0
            </p>
          </div>
          <button onClick={onClose} disabled={isImporting} className={`p-2 rounded-full transition-colors ${isImporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-delight-gray/10'}`}>
            <X className="w-5 h-5 text-delight-gray" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-6">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-delight-dark mb-2">Sube tu archivo Base Maestra</h3>
              <p className="text-sm text-delight-gray/70 max-w-md text-center mb-8">
                Selecciona el archivo de Excel (.xlsx, .csv) que contiene tus productos e inventario. El sistema detectará las pestañas "Productos" e "Insumos" automáticamente.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-delight-dark text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-delight-dark-hover transition-colors shadow-lg shadow-delight-dark/20 flex items-center gap-2 cursor-pointer"
              >
                Seleccionar Archivo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {parseErrors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    Errores de Importación (Omitidos)
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
                    {parseErrors.map((err, i) => (
                      <li key={i}>Fila {err.row}: {err.msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-white p-5 rounded-2xl border border-delight-gray/10 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-delight-dark">Archivo detectado: {file?.name}</h4>
                  <p className="text-xs text-delight-gray mt-1">Validación completada con éxito.</p>
                </div>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex flex-col items-center p-3 bg-emerald-50 text-emerald-700 rounded-xl min-w-[100px]">
                    <span className="text-xl font-black">{newProducts.length}</span>
                    <span className="text-[10px] uppercase">Nuevos Prod.</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-blue-50 text-blue-700 rounded-xl min-w-[100px]">
                    <span className="text-xl font-black">{updatedProducts.length}</span>
                    <span className="text-[10px] uppercase">A actualizar</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-amber-50 text-amber-700 rounded-xl min-w-[100px]">
                    <span className="text-xl font-black">{newIngredients.length}</span>
                    <span className="text-[10px] uppercase">Insumos nuevos</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-delight-gray/10 shadow-sm">
                <h4 className="font-bold text-delight-dark mb-3">Opciones de Importación</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-delight-gray/10 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-delight-green rounded focus:ring-delight-green accent-delight-green" 
                      checked={importOptions.createNew}
                      onChange={(e) => setImportOptions({...importOptions, createNew: e.target.checked})}
                    />
                    <div>
                      <div className="font-semibold text-sm text-delight-dark">Crear nuevos productos</div>
                      <div className="text-xs text-delight-gray">Agregar los productos que no existen actualmente en el catálogo.</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-delight-gray/10 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-delight-green rounded focus:ring-delight-green accent-delight-green" 
                      checked={importOptions.updateExisting}
                      onChange={(e) => setImportOptions({...importOptions, updateExisting: e.target.checked})}
                    />
                    <div>
                      <div className="font-semibold text-sm text-delight-dark">Actualizar productos existentes</div>
                      <div className="text-xs text-delight-gray">Sobrescribir precios, recompensas y disponibilidad de los productos actuales. Desmarca para omitir repetidos.</div>
                    </div>
                  </label>
                </div>
              </div>

              {updatedProducts.length > 0 && (
                <div>
                  <h4 className="font-bold text-delight-dark flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Conflictos / Actualizaciones ({updatedProducts.length})
                  </h4>
                  <div className="bg-white border border-delight-gray/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs text-delight-gray uppercase">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Producto</th>
                          <th className="px-4 py-3 font-semibold">Precio Actual</th>
                          <th className="px-4 py-3 font-semibold">Nuevo Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {updatedProducts.map((u, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-medium text-delight-dark">{u.new.name}</td>
                            <td className="px-4 py-3 text-delight-gray">${u.old.prices[SalesChannel.MOSTRADOR]}</td>
                            <td className="px-4 py-3 text-emerald-600 font-bold">${u.new.prices[SalesChannel.MOSTRADOR]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {newProducts.length > 0 && (
                <div>
                  <h4 className="font-bold text-delight-dark flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Productos Nuevos ({newProducts.length})
                  </h4>
                  <div className="bg-white border border-delight-gray/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs text-delight-gray uppercase">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Producto</th>
                          <th className="px-4 py-3 font-semibold">Categoría</th>
                          <th className="px-4 py-3 font-semibold">Mostrador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {newProducts.map((p, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-medium text-delight-dark">{p.name}</td>
                            <td className="px-4 py-3 text-delight-gray">{p.category}</td>
                            <td className="px-4 py-3 font-bold text-delight-green">${p.prices[SalesChannel.MOSTRADOR]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {step === 2 && (
          <div className="p-6 border-t border-delight-gray/10 bg-[#FFFDF8] flex justify-end gap-3">
            {!isImporting && !importDone && (
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-2.5 text-sm font-bold text-delight-gray hover:text-delight-dark transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button 
              onClick={confirmImport}
              disabled={isImporting || importDone}
              className={`px-6 py-2.5 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors shadow-md flex items-center gap-2 ${importDone ? 'bg-emerald-500 shadow-emerald-500/20' : isImporting ? 'bg-delight-gray shadow-none' : 'bg-delight-green hover:bg-delight-green-hover shadow-delight-green/20 cursor-pointer'}`}
            >
              {importDone ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Importación completada
                </>
              ) : isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Confirmar Importación
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
