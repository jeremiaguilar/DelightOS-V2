const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

// Add state for cart
code = code.replace(
  /const \[cart, setCart\] = useState<OrderItem\[\]>\(\[\]\);/,
  "const [cart, setCart] = useState<OrderItem[]>([]);\n  const [isCartOpen, setIsCartOpen] = useState(false);"
);

// Main div: make it block on mobile, grid on lg
const mainDivRegex = /<div className="h-\[calc\(100vh-64px\)\] flex flex-col lg:grid lg:grid-cols-12 gap-5 p-3 lg:p-5 font-sans select-none overflow-hidden bg-\[#FFFDF8\] overflow-y-auto lg:overflow-hidden">/;
const mainDivNew = `<div className="h-[calc(100vh-64px)] flex flex-col lg:grid lg:grid-cols-12 gap-5 p-3 lg:p-5 font-sans select-none overflow-hidden bg-[#FFFDF8] lg:overflow-hidden relative">`;
code = code.replace(mainDivRegex, mainDivNew);

// Left side: hide on mobile if cart is open? Or maybe we don't hide it, just the cart slides over it.
// We can just leave it full height.

// Cart block
const cartOld = `<div className="col-span-4 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col h-full">`;
const cartNew = `
      {/* Mobile Cart Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}
      <div className={\`
        fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col h-full
        \${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:col-span-4 lg:rounded-[2rem] lg:border lg:border-delight-gray/10 lg:shadow-xl
      \`}>
        <div className="lg:hidden absolute top-4 right-4 z-50">
          <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
`;
code = code.replace(cartOld, cartNew);

// Add mobile sticky checkout button if cart is not empty and cart is closed
const mobileBtn = `
      {!isCartOpen && cart.length > 0 && posMode !== 'error' && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] py-4 bg-delight-dark text-white rounded-2xl shadow-2xl font-black uppercase tracking-widest flex justify-between px-6 items-center z-30"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5"/>
            Ver Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </span>
          <span>\${(cart.reduce((sum, item) => sum + item.subtotal, 0) + cart.reduce((sum, item) => sum + item.extrasCost + item.cubiertosCost, 0)).toFixed(2)}</span>
        </button>
      )}
`;

// Insert mobileBtn before the final closing div of POSView
code = code.replace(/    <\/div>\n  \);\n\}/, mobileBtn + "\n    </div>\n  );\n}");

fs.writeFileSync('src/components/POSView.tsx', code);
