const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

code = code.replace(
  /const handleFinalizeOrder = \(method: PaymentMethod\) => \{/,
  "const handleFinalizeOrder = async (method: PaymentMethod) => {"
);

code = code.replace(
  /onOrderCompleted\(order\);\n\n\s+\/\/ Reset local state\n\s+setCart\(\[\]\);/,
  `try {
      await onOrderCompleted(order);
      setCart([]);
    } catch (e: any) {
      alert("Error al finalizar venta: " + (e.message || "Revisa la consola."));
      return;
    }
`
);

fs.writeFileSync('src/components/POSView.tsx', code);
