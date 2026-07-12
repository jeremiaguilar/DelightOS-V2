const fs = require('fs');
let code = fs.readFileSync('src/components/InventoryView.tsx', 'utf8');

code = code.replace(
  /import \{ useInventoryContext \} from '\.\.\/contexts\/InventoryContext';/,
  "import { useInventoryContext } from '../contexts/InventoryContext';\nimport InventoryMovementModal from './InventoryMovementModal';"
);

code = code.replace(
  /export default function InventoryView\(\) \{/,
  "export default function InventoryView() {\n  const [showMovementModal, setShowMovementModal] = React.useState(false);"
);

code = code.replace(
  /<button\n\s+type="button"\n\s+onClick=\{\(\) => \{ setEditingIngredient\(null\); setShowAddModal\(true\); \}\}/,
  `<button
            type="button"
            onClick={() => setShowMovementModal(true)}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 mb-3"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Movimiento (Entrada/Salida)
          </button>
          <button
            type="button"
            onClick={() => { setEditingIngredient(null); setShowAddModal(true); }}`
);

// We need to add the modal rendering at the bottom, just before the last </div>
const modalComponent = `
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
`;

code = code.replace(/    <\/div>\n  \);\n\}/, modalComponent + "\n    </div>\n  );\n}");

fs.writeFileSync('src/components/InventoryView.tsx', code);
