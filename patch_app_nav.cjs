const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newNav = `          <button
            type="button"
            id="nav-caja"
            onClick={() => setActiveTab('caja')}
            className={\`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer \${
              activeTab === 'caja'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }\`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            Caja
          </button>
          <button`;

code = code.replace(/<button\n\s+type="button"\n\s+id="nav-rubricas"/, newNav.replace('<button', '<button\n            type="button"\n            id="nav-rubricas"'));

fs.writeFileSync('src/App.tsx', code);
