/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, SalesChannel, Ingredient, ProductRecipeItem, Reward } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';
import { 
  Grid, 
  Search, 
  Coins, 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  Sliders,
  DollarSign,
  Briefcase,
  Gift,
  Edit2,
  AlertTriangle,
  UploadCloud
} from 'lucide-react';
import CatalogImporter from './CatalogImporter';

interface CatalogViewProps {
  products: Product[];
  ingredients: Ingredient[];
  onUpdateProduct: (product: Product) => void;
  rewards: Reward[];
  onUpdateProductReward: (productId: string, allowReward: boolean, rewardPoints: number) => void;
  onApplyPointsToCategory: (category: ProductCategory, points: number) => void;
  onResetOfficialRewards: () => void;
  onImportCatalog?: (newProducts: Product[], updatedProducts: Product[], newIngredients: Ingredient[]) => Promise<void> | void;
}

export default function CatalogView({ 
  products, 
  ingredients, 
  onUpdateProduct, 
  rewards, 
  onUpdateProductReward,
  onApplyPointsToCategory,
  onResetOfficialRewards,
  onImportCatalog
}: CatalogViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [priceMostrador, setPriceMostrador] = useState<number>(0);
  const [priceUber, setPriceUber] = useState<number>(0);
  const [priceDidi, setPriceDidi] = useState<number>(0);
  const [priceOnline, setPriceOnline] = useState<number>(0);
  const [recipeItems, setRecipeItems] = useState<ProductRecipeItem[]>([]);

  // Product Reward Edit State
  const [editingProductReward, setEditingProductReward] = useState<Product | null>(null);
  const [editPoints, setEditPoints] = useState<number>(20);
  const [editAllow, setEditAllow] = useState<boolean>(true);

  // Apply to Category State
  const [applyingCategory, setApplyingCategory] = useState<ProductCategory | null>(null);
  const [applyPointsValue, setApplyPointsValue] = useState<number>(40);

  const [showImporter, setShowImporter] = useState(false);

  const handleOpenEditProductReward = (prod: Product) => {
    setEditingProductReward(prod);
    setEditPoints(prod.rewardPoints ?? 20);
    setEditAllow(prod.allowReward !== false);
  };

  const handleSaveProductReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductReward) return;
    onUpdateProductReward(editingProductReward.id, editAllow, editPoints);
    setEditingProductReward(null);
  };

  const handleOpenApplyCategoryPoints = (cat: ProductCategory) => {
    setApplyingCategory(cat);
    // Default values depending on category to make it faster for the user
    if (cat === "Extras") setApplyPointsValue(5);
    else if (cat === "Café") setApplyPointsValue(20);
    else if (cat === "Frappés") setApplyPointsValue(20);
    else if (cat === "Smoothies") setApplyPointsValue(20);
    else if (cat === "Makis Naturales" || cat === "Makis Queso" || cat === "Makis") setApplyPointsValue(40);
    else if (cat === "Makis Empanizados") setApplyPointsValue(45);
    else if (cat === "Sushiburger") setApplyPointsValue(50);
    else setApplyPointsValue(40);
  };

  const handleSaveCategoryPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingCategory) return;
    onApplyPointsToCategory(applyingCategory, applyPointsValue);
    setApplyingCategory(null);
  };

  // Helpers
  const activeProducts = products.filter(p => p.active !== false);
  const dynamicCategories = Array.from(new Set(activeProducts.map(p => p.category)));
  const categories = ['Todos', ...dynamicCategories];

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeProducts, activeCategory, searchQuery]);

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setPriceMostrador(product.prices[SalesChannel.MOSTRADOR]);
    setPriceUber(product.prices[SalesChannel.UBER]);
    setPriceDidi(product.prices[SalesChannel.DIDI]);
    setPriceOnline(product.prices[SalesChannel.ONLINE_FUTURE]);
    setRecipeItems([...product.recipe]);
  };

  const handleAddRecipeIngredient = (ingredientId: string) => {
    if (recipeItems.some(item => item.ingredientId === ingredientId)) return;
    setRecipeItems([...recipeItems, { ingredientId, quantity: 10 }]);
  };

  const handleRemoveRecipeIngredient = (ingredientId: string) => {
    setRecipeItems(recipeItems.filter(item => item.ingredientId !== ingredientId));
  };

  const handleRecipeQuantityChange = (ingredientId: string, quantity: number) => {
    setRecipeItems(recipeItems.map(item => 
      item.ingredientId === ingredientId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Build updated product with correct prices and formula
    const updated: Product = {
      ...editingProduct,
      prices: {
        [SalesChannel.MOSTRADOR]: priceMostrador,
        [SalesChannel.UBER]: priceUber,
        [SalesChannel.DIDI]: priceDidi,
        [SalesChannel.ESPECIAL]: priceMostrador * 0.85, // Rule: Especial auto calculated 15% off Mostrador
        [SalesChannel.ONLINE_FUTURE]: priceOnline
      },
      recipe: recipeItems
    };

    onUpdateProduct(updated);
    setEditingProduct(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] p-5 font-sans grid grid-cols-12 gap-5 select-none overflow-hidden bg-[#FFFDF8]">
      
      {/* Product Catalog Grid (Left 8 columns) */}
      <div className="col-span-8 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col h-full">
        
        {/* Header toolbar */}
        <div className="p-5 border-b border-delight-gray/10 flex flex-wrap justify-between items-center gap-4 bg-[#FFFDF8] shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5.5 h-5.5 text-delight-green" />
            <h3 className="font-extrabold text-delight-dark text-base">Fichas de Productos y Precios</h3>
          </div>

          <div className="flex gap-3 items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-delight-gray/40 w-4 h-4" />
              <input
                type="text"
                id="catalog-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
                placeholder="Buscar artículo..."
              />
            </div>
            {onImportCatalog && (
              <button 
                onClick={() => setShowImporter(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors font-bold text-xs shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                Importar Base Maestra
              </button>
            )}
          </div>
        </div>

        {/* Categories Tab selector */}
        <div className="px-5 py-3 border-b border-delight-gray/10 flex gap-2 overflow-x-auto scrollbar-thin shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              id={`catalog-cat-tab-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setActiveCategory(cat)}
              className={`py-2 px-4 rounded-xl font-bold text-xs shrink-0 transition-all border ${
                activeCategory === cat
                  ? 'bg-delight-green border-delight-green text-white shadow-sm'
                  : 'bg-white border-delight-gray/10 text-delight-gray hover:bg-delight-dark/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content list layout */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-delight-gray/5 rounded-2xl p-5 hover:border-delight-green/15 transition-all shadow-sm flex flex-col justify-between h-56 group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-bold text-delight-green bg-delight-green/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {p.category}
                    </span>
                    <span className="text-[10px] text-delight-gray/40 font-mono font-bold">RECETA: {p.recipe.length} INS.</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-delight-dark group-hover:text-delight-green transition-colors mt-1 leading-tight line-clamp-2">
                    {p.name}
                  </h4>
                </div>

                {/* Grid breakdown of the separation prices */}
                <div className="bg-delight-dark/2 p-3 rounded-xl space-y-1 my-3 text-[10px] font-semibold text-delight-gray">
                  <div className="flex justify-between items-center">
                    <span>💵 Mostrador:</span>
                    <span className="text-delight-dark font-extrabold">${p.prices[SalesChannel.MOSTRADOR].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🚗 Uber Eats:</span>
                    <span className="text-delight-dark font-extrabold">${p.prices[SalesChannel.UBER].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🛵 DiDi Food:</span>
                    <span className="text-delight-dark font-extrabold">${p.prices[SalesChannel.DIDI].toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`edit-prod-prices-btn-${p.id}`}
                  onClick={() => handleOpenEdit(p)}
                  className="w-full py-2 bg-gradient-to-r from-delight-green/10 to-delight-green/20 hover:from-delight-green hover:to-delight-green text-delight-green hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Sliders className="w-4.5 h-4.5 shrink-0" />
                  Editar Precios y Receta
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right panel: Recompensas Club DELIGHT (4 columns) */}
      <div className="col-span-4 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col h-full">
        {/* Header toolbar */}
        <div className="p-5 border-b border-delight-gray/10 flex flex-col gap-3 bg-[#FFFDF8] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5.5 h-5.5 text-delight-yellow animate-pulse" />
              <div>
                <h3 className="font-extrabold text-delight-dark text-sm lg:text-base leading-none">Recompensas Club DELIGHT</h3>
                <span className="text-[10px] font-bold text-delight-green uppercase tracking-wider block mt-1">Canje con puntos</span>
              </div>
            </div>
          </div>
          
          {/* Reset button */}
          <button
            type="button"
            id="reset-official-rewards-btn"
            onClick={onResetOfficialRewards}
            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Coins className="w-4 h-4 shrink-0" />
            Restablecer valores oficiales
          </button>
        </div>

        {/* List of rewards by category */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {dynamicCategories.map((cat) => {
            const catProducts = products.filter(p => p.category === cat);
            if (catProducts.length === 0) return null;
            return (
              <div key={cat} className="space-y-3 bg-delight-dark/2 p-3.5 rounded-2xl border border-delight-gray/5">
                <div className="flex justify-between items-center border-b border-delight-gray/5 pb-2">
                  <span className="text-[10px] font-black text-delight-dark uppercase tracking-wider">{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenApplyCategoryPoints(cat)}
                    className="text-[10px] font-extrabold text-delight-green hover:text-delight-green-hover hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Aplicar a todo
                  </button>
                </div>
                
                <div className="space-y-3">
                  {catProducts.map((p) => {
                    const rewardPoints = p.rewardPoints ?? 20;
                    const allowReward = p.allowReward !== false;
                    return (
                      <div key={p.id} className="flex items-start justify-between text-xs group">
                        <div className="flex-1 pr-2">
                          <span className="font-bold text-delight-dark block leading-snug group-hover:text-delight-green transition-colors">{p.name}</span>
                          <span className="text-[9px] text-delight-gray/50 block font-semibold mt-0.5">
                            P.V: ${p.prices[SalesChannel.MOSTRADOR].toFixed(2)} • ≈ ${(rewardPoints * 100).toLocaleString('es-MX')} compra
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Points pill */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditProductReward(p)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-0.5 transition-all hover:scale-105 cursor-pointer ${
                              allowReward 
                                ? 'bg-delight-yellow/10 hover:bg-delight-yellow/20 text-delight-yellow' 
                                : 'bg-delight-gray/10 hover:bg-delight-gray/25 text-delight-gray'
                            }`}
                            title="Editar puntos de canje"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            {rewardPoints} pts
                          </button>

                          {/* Toggle switch */}
                          <button
                            type="button"
                            onClick={() => onUpdateProductReward(p.id, !allowReward, rewardPoints)}
                            className={`w-9 h-5.5 flex items-center rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                              allowReward ? 'bg-delight-green' : 'bg-delight-gray/20'
                            }`}
                            title={allowReward ? 'Desactivar canje' : 'Activar canje'}
                          >
                            <div
                              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                                allowReward ? 'translate-x-3.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT PRICES & RECIPE FORM MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form 
            onSubmit={handleSaveProduct}
            className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-delight-gray/10 mb-5 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-delight-green uppercase tracking-wider bg-delight-green/10 px-2.5 py-1 rounded-full">
                  Ficha Técnica
                </span>
                <h3 className="text-base font-extrabold text-delight-dark mt-2">{editingProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split panes */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-6 pr-1 pb-4">
              
              {/* Left Column: Channels pricing config */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-delight-gray uppercase tracking-widest block pb-2 border-b border-delight-gray/5">
                  1. Precios de Canales Oficiales
                </span>
                
                <div>
                  <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-wider mb-1 ml-1">
                    Precio Mostrador ($ MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/50 font-bold text-xs">$</span>
                    <input
                      type="number"
                      required
                      min={0}
                      id="edit-price-mostrador"
                      value={priceMostrador}
                      onChange={(e) => setPriceMostrador(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-8 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>
                  <span className="text-[10px] text-delight-green font-bold mt-1 block">
                    * Venta Especial auto-calculado: ${(priceMostrador * 0.85).toFixed(2)} (15% OFF)
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-wider mb-1 ml-1">
                    Precio Uber Eats ($ MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/50 font-bold text-xs">$</span>
                    <input
                      type="number"
                      required
                      min={0}
                      id="edit-price-uber"
                      value={priceUber}
                      onChange={(e) => setPriceUber(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-8 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-wider mb-1 ml-1">
                    Precio DiDi Food ($ MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/50 font-bold text-xs">$</span>
                    <input
                      type="number"
                      required
                      min={0}
                      id="edit-price-didi"
                      value={priceDidi}
                      onChange={(e) => setPriceDidi(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-8 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-wider mb-1 ml-1">
                    Precio Tienda Online ($ MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/50 font-bold text-xs">$</span>
                    <input
                      type="number"
                      required
                      min={0}
                      id="edit-price-online"
                      value={priceOnline}
                      onChange={(e) => setPriceOnline(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-8 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Recipe Formulas config */}
              <div className="space-y-4 border-l border-delight-gray/10 pl-6 flex flex-col h-full overflow-hidden">
                <span className="text-xs font-bold text-delight-gray uppercase tracking-widest block pb-2 border-b border-delight-gray/5">
                  2. Receta / Descuento de Insumos
                </span>

                {/* List of current recipe connections */}
                <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[220px]">
                  {recipeItems.length === 0 ? (
                    <p className="text-center text-[11px] text-delight-gray/40 py-8">Este producto no descuenta insumos. Agrega un ingrediente abajo.</p>
                  ) : (
                    recipeItems.map((item) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      if (!ing) return null;
                      return (
                        <div key={item.ingredientId} className="flex items-center gap-2.5 bg-delight-dark/2 p-2.5 rounded-xl border border-delight-gray/5 justify-between">
                          <div className="flex-1">
                            <span className="text-xs font-bold text-delight-dark block">{ing.name}</span>
                            <span className="text-[10px] text-delight-gray/50 block">Unidad: {ing.unit}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              required
                              min={1}
                              id={`recipe-qty-${item.ingredientId}`}
                              value={item.quantity}
                              onChange={(e) => handleRecipeQuantityChange(item.ingredientId, parseInt(e.target.value) || 1)}
                              className="w-16 bg-white border border-delight-gray/10 rounded-lg py-1 px-2 text-center text-xs font-bold outline-none focus:border-delight-green/30"
                            />
                            <span className="text-[10px] font-bold text-delight-gray uppercase w-6">{ing.unit}</span>
                            
                            <button
                              type="button"
                              id={`del-recipe-ing-${item.ingredientId}`}
                              onClick={() => handleRemoveRecipeIngredient(item.ingredientId)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add new Ingredient selector */}
                <div className="pt-3 border-t border-delight-gray/5 shrink-0">
                  <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Vincular Insumo a Receta</label>
                  <select
                    id="add-recipe-ingredient-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddRecipeIngredient(e.target.value);
                        e.target.value = ''; // Reset
                      }
                    }}
                    className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-bold outline-none cursor-pointer hover:bg-delight-dark/10"
                  >
                    <option value="">-- Seleccionar insumo --</option>
                    {ingredients
                      .filter(ing => !recipeItems.some(ri => ri.ingredientId === ing.id))
                      .map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))
                    }
                  </select>
                </div>

              </div>

            </div>

            {/* Save bar */}
            <div className="pt-4 border-t border-delight-gray/10 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-3 bg-white border border-delight-gray/15 rounded-xl font-bold text-xs text-delight-gray hover:bg-delight-dark/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                id="save-prod-changes-btn"
                className="flex-1 py-3 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-delight-green/15 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>

          </form>
        </div>
      )}

      {/* EDIT PRODUCT REWARD MODAL */}
      {editingProductReward && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form 
            onSubmit={handleSaveProductReward}
            className="bg-white rounded-[2rem] border border-delight-gray/10 shadow-2xl p-6 w-full max-w-md flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center pb-4 border-b border-delight-gray/10 mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <Gift className="w-5.5 h-5.5 text-delight-yellow" />
                <div>
                  <h3 className="text-base font-extrabold text-delight-dark">Configurar Canje de Producto</h3>
                  <p className="text-[10px] text-delight-gray/50 font-semibold">Editar puntos y estado de canje</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProductReward(null)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 py-2">
              {/* Product info summary */}
              <div className="bg-delight-yellow/5 border border-delight-yellow/10 rounded-2xl p-4">
                <h4 className="text-sm font-extrabold text-delight-dark">{editingProductReward.name}</h4>
                <p className="text-xs text-delight-gray/60 mt-0.5">Precio de venta regular: <strong className="text-delight-green">${editingProductReward.prices[SalesChannel.MOSTRADOR].toFixed(2)}</strong></p>
              </div>

              {/* Points Required input */}
              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-wider mb-2 ml-1">
                  Puntos Requeridos para Canje
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditPoints(prev => Math.max(1, prev - 5))}
                    className="p-3 bg-delight-dark/5 hover:bg-delight-dark/10 text-delight-dark rounded-xl font-bold transition-colors"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPoints(prev => Math.max(1, prev - 1))}
                    className="p-3 bg-delight-dark/5 hover:bg-delight-dark/10 text-delight-dark rounded-xl font-bold transition-colors"
                  >
                    -1
                  </button>
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/50 font-bold text-xs">
                      <Coins className="w-4 h-4 text-delight-yellow" />
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      id="edit-product-reward-points"
                      value={editPoints}
                      onChange={(e) => setEditPoints(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 pl-10 pr-4 text-center text-sm font-black outline-none focus:bg-white focus:border-delight-yellow/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPoints(prev => prev + 1)}
                    className="p-3 bg-delight-dark/5 hover:bg-delight-dark/10 text-delight-dark rounded-xl font-bold transition-colors"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPoints(prev => prev + 5)}
                    className="p-3 bg-delight-dark/5 hover:bg-delight-dark/10 text-delight-dark rounded-xl font-bold transition-colors"
                  >
                    +5
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-delight-gray/50">
                  <span>* Equivalente de compra acumulada:</span>
                  <span className="font-extrabold text-delight-green">≈ ${(editPoints * 100).toLocaleString('es-MX')} MXN</span>
                </div>
              </div>

              {/* Active Toggle form */}
              <div className="flex items-center justify-between p-4 bg-white border border-delight-gray/10 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-delight-dark block">Permitir canje con puntos</span>
                  <span className="text-[10px] text-delight-gray/50 font-medium">Habilitar en el Punto de Venta (POS)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAllow(!editAllow)}
                  className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors focus:outline-none cursor-pointer ${
                    editAllow ? 'bg-delight-green' : 'bg-delight-gray/20'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      editAllow ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save bar */}
            <div className="pt-5 border-t border-delight-gray/10 shrink-0 flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setEditingProductReward(null)}
                className="flex-1 py-3 bg-white border border-delight-gray/15 rounded-xl font-bold text-xs text-delight-gray hover:bg-delight-dark/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                id="save-product-reward-btn"
                className="flex-1 py-3 bg-gradient-to-r from-delight-yellow to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-delight-yellow/15 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APPLY POINTS TO CATEGORY MODAL */}
      {applyingCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form 
            onSubmit={handleSaveCategoryPoints}
            className="bg-white rounded-[2rem] border border-delight-gray/10 shadow-2xl p-6 w-full max-w-md flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center pb-4 border-b border-delight-gray/10 mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-5.5 h-5.5 text-delight-green" />
                <div>
                  <h3 className="text-base font-extrabold text-delight-dark">Aplicar puntos a categoría</h3>
                  <p className="text-[10px] text-delight-gray/50 font-semibold">Configuración masiva de canje</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyingCategory(null)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 py-2">
              <div className="bg-delight-green/5 border border-delight-green/10 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-delight-green uppercase tracking-wider block">Categoría seleccionada</span>
                <h4 className="text-sm font-black text-delight-dark mt-1 uppercase">{applyingCategory}</h4>
                <p className="text-[11px] text-delight-gray/60 mt-1 leading-relaxed">Se aplicarán estos puntos de canje a todos los productos de esta categoría, y se activará la opción de canje para todos ellos de forma masiva.</p>
              </div>

              {/* Points input */}
              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-wider mb-2 ml-1">
                  Puntos a aplicar
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/50 font-bold text-xs">
                    <Coins className="w-4 h-4 text-delight-yellow" />
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    id="apply-category-points"
                    value={applyPointsValue}
                    onChange={(e) => setApplyPointsValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 pl-10 pr-4 text-center text-sm font-black outline-none focus:bg-white focus:border-delight-green/30"
                  />
                </div>
              </div>
            </div>

            {/* Save bar */}
            <div className="pt-5 border-t border-delight-gray/10 shrink-0 flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setApplyingCategory(null)}
                className="flex-1 py-3 bg-white border border-delight-gray/15 rounded-xl font-bold text-xs text-delight-gray hover:bg-delight-dark/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                id="apply-category-changes-btn"
                className="flex-1 py-3 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-delight-green/15 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Aplicar masivamente
              </button>
            </div>
          </form>
        </div>
      )}

      {showImporter && (
        <CatalogImporter 
          onClose={() => setShowImporter(false)}
          existingProducts={products}
          existingIngredients={ingredients}
          onImportComplete={async (newProds, updatedProds, newIngs) => {
            if (onImportCatalog) {
              await onImportCatalog(newProds, updatedProds, newIngs);
            }
            setShowImporter(false);
          }}
        />
      )}

    </div>
  );
}
