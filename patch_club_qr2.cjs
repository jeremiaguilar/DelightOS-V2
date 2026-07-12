const fs = require('fs');
let code = fs.readFileSync('src/components/ClubDelightView.tsx', 'utf8');

code = code.replace(
  /import \{ useUserContext \} from '\.\.\/contexts\/UserContext';/,
  "import { useUserContext } from '../contexts/UserContext';\nimport { QRCodeSVG } from 'qrcode.react';"
);

const qrRegex = /\{\/\* Beautiful, responsive simulated vector QR Code \*\/\}[\s\S]*?<\/p>\n\s+<\/div>\n\s+<\/div>/;
const newQr = `{/* Actual functional QR Code */}
                    <div className="p-4 border border-dashed border-delight-gray/15 rounded-[1.5rem] flex flex-col items-center justify-center bg-gray-50/50">
                      <QrCode className="w-7 h-7 text-delight-dark/40 mb-2" />
                      <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center justify-center shadow-inner">
                        <QRCodeSVG value={selectedCustomer.qrCode} size={150} level="H" includeMargin={false} />
                      </div>
                      <p className="mt-3 text-[10px] font-mono font-bold text-delight-gray/50 tracking-wider">
                        Escanear para vincular cuenta
                      </p>
                    </div>`;

code = code.replace(qrRegex, newQr);
fs.writeFileSync('src/components/ClubDelightView.tsx', code);
