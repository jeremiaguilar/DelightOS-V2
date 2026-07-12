/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';
import InventoryMovementModal from './InventoryMovementModal';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Check, 
  X, 
  PlusCircle, 
  RefreshCw,
  Archive,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface InventoryViewProps {
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Ingredient) => void;
  onUpdateIngredient: (ingredient: Ingredient) => void;
  onAdjustStock: (ingredientId: string, amount: number) => void;
}

export default function InventoryView({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onAdjustStock
}: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Ingredient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formStock, setFormStock] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('g');
  const [formMinStock, setFormMinStock] = useState<number>(1000);
  const [error, setError] = useState('');

  // Quick Adjustment State
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);

  // Filter Ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ingredients, searchQuery]);

  // Total items alert counts
  const lowStockCount = useMemo(() => {
    return ingredients.filter(i => i.stock <= i.minStock).length;
  }, [ingredients]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormStock(0);
    setFormUnit('g');
    setFormMinStock(1000);
    setError('');
    setShowAddModal(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formStock < 0 || formMinStock < 0) {
      setError('Por favor complete todos los campos.');
      return;
    }

    // Generate unique ID
    const ids = ingredients.map(i => parseInt(i.id.split('-')[1] || '100'));
    const maxId = Math.max(...ids, 18);
    const nextId = `ing-${maxId + 1}`;

    const newIng: Ingredient = {
      id: nextId,
      name: formName.trim(),
      stock: formStock,
      unit: formUnit,
      minStock: formMinStock,
      active: true
    };

    onAddIngredient(newIng);
    setShowAddModal(false);
  };

  const handleProcessAdjustment = (ingredientId: string, multiplier: 1 | -1) => {
    if (adjustAmount <= 0) return;
    onAdjustStock(ingredientId, adjustAmount * multiplier);
    setAdjustingIngredient(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] p-3 lg:p-5 font-sans flex flex-col lg:grid lg:grid-cols-12 gap-5 select-none overflow-hidden bg-[#FFFDF8] overflow-y-auto lg:overflow-hidden">
      
      {/* Sidebar Stats and Alarms panel (3 columns) */}
      <div className="col-span-3 flex flex-col gap-4">
        
        {/* Main Alarm status widget */}
        <div className="bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-5 flex flex-col justify-between h-48">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest block">Alertas de Almacén</span>
              <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-red-500 animate-bounce' : 'text-delight-green'}`} />
            </div>
            
            <h4 className="text-3xl font-black text-delight-dark tracking-tight">
              {lowStockCount}
            </h4>
            <p className="text-xs font-semibold text-delight-gray/80 mt-1">Insumos bajo stock mínimo</p>
          </div>

          <div className="pt-3 border-t border-delight-gray/5">
            {lowStockCount > 0 ? (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 py-1 px-2 rounded-lg inline-block">Reabastecimiento Requerido</span>
            ) : (
              <span className="text-[10px] font-bold text-delight-green bg-delight-green/10 py-1 px-2 rounded-lg inline-block">Nivel de Stock Óptimo</span>
            )}
          </div>
        </div>

        {/* Quick add guide */}
        <div className="bg-gradient-to-br from-delight-green/5 to-white rounded-[2rem] border border-delight-green/15 p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold text-delight-green uppercase tracking-widest block">Insumos y Logística</span>
            <h4 className="text-sm font-extrabold text-delight-dark leading-snug">Gestión Avanzada de Bodega</h4>
            <p className="text-[11px] text-delight-gray leading-relaxed font-medium">
              Al finalizar una venta o canje, DelightOS descuenta automáticamente las materias primas asociadas de forma proporcional.
            </p>
            <p className="text-[11px] text-delight-gray leading-relaxed font-medium">
              Utiliza los botones de ajuste para ingresar compras de proveedores o descontar mermas operativas de cocina.
            </p>
          </div>

          <button
            type="button"
            id="register-new-ingredient-btn"
            onClick={handleOpenAdd}
            className="w-full py-3.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow shadow-delight-green/15 hover:shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Nuevo Insumo
          </button>
        </div>

      </div>

      {/* Main Stock Table Sheet (9 columns) */}
      <div className="lg:col-span-9 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col shrink-0 lg:h-full">
        
        {/* List Header and Search */}
        <div className="p-5 border-b border-delight-gray/10 flex justify-between items-center bg-[#FFFDF8] shrink-0">
          <div className="flex items-center gap-2">
            <Archive className="w-5.5 h-5.5 text-delight-green" />
            <h3 className="font-extrabold text-delight-dark text-base font-sans">Inventario de Almacén</h3>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-delight-gray/40 w-4 h-4" />
            <input
              type="text"
              id="inventory-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
              placeholder="Buscar materia prima..."
            />
          </div>
        </div>

        {/* Grid Sheet of Raw Ingredients */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-delight-dark/5 text-[9px] font-bold uppercase tracking-wider text-delight-gray sticky top-0 z-10">
              <tr>
                <th className="py-3 px-5">ID Insumo</th>
                <th className="py-3 px-5">Insumo</th>
                <th className="py-3 px-5 text-center">Nivel Mínimo</th>
                <th className="py-3 px-5 text-center">Stock Actual</th>
                <th className="py-3 px-5 text-right">Acciones de Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-delight-gray/5 text-xs text-delight-dark font-semibold">
              {filteredIngredients.map((ing) => {
                const isLow = ing.stock <= ing.minStock;
                return (
                  <tr
                    key={ing.id}
                    id={`row-ing-${ing.id}`}
                    className={`hover:bg-delight-dark/2 transition-colors ${
                      isLow ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono text-delight-gray">{ing.id}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span>{ing.name}</span>
                        {isLow && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded uppercase">
                            Bajo Mínimo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono text-delight-gray">
                      {ing.minStock} {ing.unit}
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono">
                      <span className={`font-black ${isLow ? 'text-red-600' : 'text-delight-dark'}`}>
                        {ing.stock}
                      </span>
                      <span className="text-delight-gray/50 ml-1 text-[10px]">{ing.unit}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        id={`adjust-btn-${ing.id}`}
                        onClick={() => {
                          setAdjustingIngredient(ing);
                          setAdjustAmount(ing.unit === 'pz' || ing.unit === 'pzs' ? 5 : 500); // sensible defaults
                        }}
                        className="py-1.5 px-3 bg-gradient-to-r from-delight-green/10 to-delight-green/20 hover:from-delight-green hover:to-delight-green hover:text-white text-delight-green text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        Ajustar Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* QUICK ADJUST MODAL SHEET */}
      {adjustingIngredient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-7 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-delight-dark uppercase tracking-wider">Ajustar Stock Físico</h3>
              <button
                type="button"
                onClick={() => setAdjustingIngredient(null)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center bg-gray-50/60 p-4 rounded-2xl border border-delight-gray/5">
              <span className="text-[10px] font-bold text-delight-gray uppercase">Insumo Seleccionado</span>
              <h4 className="text-base font-extrabold text-delight-dark mt-1">{adjustingIngredient.name}</h4>
              <span className="text-xs font-mono font-bold text-delight-gray mt-2 block">
                Stock actual: {adjustingIngredient.stock} {adjustingIngredient.unit}
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Cantidad a Ajustar</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  id="adjust-ingredient-qty"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-sm font-bold outline-none focus:bg-white focus:border-delight-green/30 text-center font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-delight-gray uppercase">
                  {adjustingIngredient.unit}
                </span>
              </div>
            </div>

            {/* Adjustment channels */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                id="adjust-add-btn"
                onClick={() => handleProcessAdjustment(adjustingIngredient.id, 1)}
                className="py-3.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 shadow shadow-delight-green/10 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>+ Abasto (Entrada)</span>
              </button>

              <button
                type="button"
                id="adjust-sub-btn"
                onClick={() => handleProcessAdjustment(adjustingIngredient.id, -1)}
                className="py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-red-200/50 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowDownRight className="w-5 h-5" />
                <span>- Merma (Salida)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INGREDIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form 
            onSubmit={handleSaveIngredient}
            className="bg-white rounded-[2rem] w-full max-w-md p-7 shadow-2xl space-y-5"
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-delight-dark">Registrar Materia Prima</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl p-3 text-[11px] text-red-700 font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Nombre del Insumo</label>
                <input
                  type="text"
                  required
                  id="form-ing-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                  placeholder="Ej. Salsa Dulce de Mango"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Stock de Inicio</label>
                  <input
                    type="number"
                    min={0}
                    required
                    id="form-ing-stock"
                    value={formStock}
                    onChange={(e) => setFormStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Unidad de Medida</label>
                  <select
                    id="form-ing-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30 cursor-pointer"
                  >
                    <option value="g">g (Gramos)</option>
                    <option value="ml">ml (Mililitros)</option>
                    <option value="pz">pz (Piezas)</option>
                    <option value="kg">kg (Kilogramos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Nivel Mínimo de Alerta (bajo stock)</label>
                <input
                  type="number"
                  min={0}
                  required
                  id="form-ing-minstock"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30"
                />
              </div>
            </div>

            <button
              type="submit"
              id="submit-ing-form-btn"
              className="w-full py-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-6"
            >
              <Check className="w-4.5 h-4.5" />
              Guardar Insumo
            </button>
          </form>
        </div>
      )}


      {showMovementModal && (
        <InventoryMovementModal
          ingredients={ingredients}
          onClose={() => setShowMovementModal(false)}
          onSave={async (ingredientId, quantity, type) => {
            const ing = ingredients.find(i => i.id === ingredientId);
            if (ing) {
              const updated = { ...ing, stock: type === 'ADJUST' ? quantity : ing.stock + quantity };
              await onUpdateIngredient(updated);
            }
          }}
        />
      )}

    </div>
  );
}
