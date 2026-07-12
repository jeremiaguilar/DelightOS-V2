const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\} from 'lucide-react';/,
  "  Menu,\n  X\n} from 'lucide-react';"
);

code = code.replace(
  /export default function AppContent\(\) \{/,
  "export default function AppContent() {\n  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);"
);

// We need to change the header to be responsive
const headerOld = `      <header className="h-16 bg-white border-b border-delight-gray/10 flex justify-between items-center px-6 shrink-0 shadow-sm z-30">`;
const headerNew = `      <header className="h-16 bg-white border-b border-delight-gray/10 flex justify-between items-center px-4 md:px-6 shrink-0 shadow-sm z-30 relative">`;
code = code.replace(headerOld, headerNew);

const navOld = `<nav className="flex gap-1 bg-delight-dark/5 p-1 rounded-xl shrink-0">`;
const navNew = `        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>\n          {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}\n        </button>\n        <nav className={\`fixed inset-x-0 top-16 bg-white border-b p-4 flex-col gap-2 z-40 shadow-xl transition-all md:relative md:top-0 md:bg-delight-dark/5 md:p-1 md:rounded-xl md:flex-row md:flex md:shadow-none \${mobileMenuOpen ? 'flex' : 'hidden md:flex'}\`}>`;

code = code.replace(navOld, navNew);

// In navigation buttons, close menu when clicked
code = code.replace(/onClick=\{\(\) => setActiveTab\('pos'\)\}/g, "onClick={() => { setActiveTab('pos'); setMobileMenuOpen(false); }}");
code = code.replace(/onClick=\{\(\) => setActiveTab\('kds'\)\}/g, "onClick={() => { setActiveTab('kds'); setMobileMenuOpen(false); }}");
code = code.replace(/onClick=\{\(\) => setActiveTab\('club'\)\}/g, "onClick={() => { setActiveTab('club'); setMobileMenuOpen(false); }}");
code = code.replace(/onClick=\{\(\) => setActiveTab\('catalog'\)\}/g, "onClick={() => { setActiveTab('catalog'); setMobileMenuOpen(false); }}");
code = code.replace(/onClick=\{\(\) => setActiveTab\('inventory'\)\}/g, "onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}");
code = code.replace(/onClick=\{\(\) => setActiveTab\('caja'\)\}/g, "onClick={() => { setActiveTab('caja'); setMobileMenuOpen(false); }}");
code = code.replace(/onClick=\{\(\) => setActiveTab\('rubricas'\)\}/g, "onClick={() => { setActiveTab('rubricas'); setMobileMenuOpen(false); }}");

fs.writeFileSync('src/App.tsx', code);
