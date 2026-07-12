const fs = require('fs');
let code = fs.readFileSync('src/components/ClubDelightView.tsx', 'utf8');

code = code.replace(
  /import \{ useUserContext \} from '\.\.\/contexts\/UserContext';/,
  "import { useUserContext } from '../contexts/UserContext';\nimport { QRCodeSVG } from 'qrcode.react';"
);

code = code.replace(
  /<div className="w-full aspect-square bg-delight-dark\/5 rounded-xl border-2 border-dashed border-delight-gray\/20 flex items-center justify-center p-4">[^<]*<p className="font-mono text-center text-xs font-bold text-delight-gray\/50 break-all leading-relaxed">[^<]*\{selectedCustomer\.qrCode\}[^<]*<\/p>[^<]*<\/div>/m,
  `<div className="w-full aspect-square bg-white rounded-xl border border-delight-gray/10 shadow-sm flex items-center justify-center p-4">
            <QRCodeSVG value={selectedCustomer.qrCode} size={200} level="H" includeMargin={false} />
          </div>`
);

fs.writeFileSync('src/components/ClubDelightView.tsx', code);
