const fs = require('fs');
let code = fs.readFileSync('src/components/InventoryView.tsx', 'utf8');

code = code.replace(
  /<div className="h-\[calc\(100vh-64px\)\] p-5 font-sans grid grid-cols-12 gap-5 select-none overflow-hidden bg-\[#FFFDF8\]">/,
  '<div className="h-[calc(100vh-64px)] p-3 lg:p-5 font-sans flex flex-col lg:grid lg:grid-cols-12 gap-5 select-none overflow-hidden bg-[#FFFDF8] overflow-y-auto lg:overflow-hidden">'
);

code = code.replace(
  /<div className="col-span-3 flex flex-col gap-5 overflow-y-auto pr-1">/,
  '<div className="lg:col-span-3 flex flex-col gap-5 shrink-0 overflow-y-visible lg:overflow-y-auto pr-1">'
);

code = code.replace(
  /<div className="col-span-9 bg-white rounded-\[2rem\] border border-delight-gray\/10 shadow-xl overflow-hidden flex flex-col h-full">/,
  '<div className="lg:col-span-9 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col shrink-0 lg:h-full">'
);

// We need to convert tables to cards on mobile:
// That's a bit harder. Let's at least add overflow-x-auto to the table container so it doesn't break layout.
code = code.replace(
  /<div className="flex-1 overflow-y-auto">/,
  '<div className="flex-1 overflow-x-auto overflow-y-auto">'
);

fs.writeFileSync('src/components/InventoryView.tsx', code);
