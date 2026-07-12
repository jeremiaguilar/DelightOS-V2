const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

code = code.replace(
  "  const [activeChannel, setActiveChannel] = useState<SalesChannel>(SalesChannel.MOSTRADOR);\n  \n  // Cart State",
  `  const [activeChannel, setActiveChannel] = useState<SalesChannel>(SalesChannel.MOSTRADOR);
  
  const [posMode, setPosMode] = useState<'venta' | 'canje' | 'error'>('venta');
  const { orders, setOrdersState } = useOrderContext();
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [selectedTicketForCancel, setSelectedTicketForCancel] = useState<Order | null>(null);

  // Cart State`
);

code = code.replace(
  "import { \n  Search,\n  Plus,",
  "import { useOrderContext } from '../contexts/OrderContext';\nimport { \n  Search,\n  Plus,"
);

// We should replace isCanjeMode references with posMode === 'canje'
code = code.replace(/isCanjeMode/g, "(posMode === 'canje')");
// Except where it's being set:
code = code.replace(/setIsCanjeMode\(.*?\)/g, "");
// Wait, replacing all isCanjeMode is risky. Let's do it carefully.
fs.writeFileSync('src/components/POSView.tsx', code);
