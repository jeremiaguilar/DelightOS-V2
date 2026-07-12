const fs = require('fs');
let code = fs.readFileSync('src/components/ClubDelightView.tsx', 'utf8');

code = code.replace(
  /<div className="h-\[calc\(100vh-64px\)\] p-5 font-sans grid grid-cols-12 gap-5 select-none overflow-hidden bg-\[#FFFDF8\]">/,
  '<div className="h-[calc(100vh-64px)] p-3 lg:p-5 font-sans flex flex-col lg:grid lg:grid-cols-12 gap-5 select-none overflow-hidden bg-[#FFFDF8] overflow-y-auto lg:overflow-hidden">'
);

code = code.replace(
  /<div className="col-span-7 bg-white rounded-\[2rem\] border border-delight-gray\/10 shadow-xl overflow-hidden flex flex-col h-full">/,
  '<div className="lg:col-span-7 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col shrink-0 lg:h-full">'
);

code = code.replace(
  /<div className="col-span-5 bg-white rounded-\[2rem\] border border-delight-gray\/10 shadow-xl flex flex-col h-full overflow-hidden relative">/,
  '<div className="lg:col-span-5 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl flex flex-col shrink-0 lg:h-full overflow-hidden relative">'
);

fs.writeFileSync('src/components/ClubDelightView.tsx', code);
