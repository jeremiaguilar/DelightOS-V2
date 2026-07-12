const fs = require('fs');
let code = fs.readFileSync('src/components/RubricasGerencialesView.tsx', 'utf8');

code = code.replace(
  'const [activeCorte, setActiveCorte] = useState<any>(() => {\n    const list = JSON.parse(localStorage.getItem(\'delight_cash_cuts\') || \'[]\');\n    return list.find((c: any) => c.status === \'abierto\') || null;\n  });',
  ''
);

code = code.replace(
  'const [cutsList, setCutsList] = useState<any[]>(() => {\n    return JSON.parse(localStorage.getItem(\'delight_cash_cuts\') || \'[]\');\n  });',
  ''
);

code = code.replace(
  /const handleStartCorte = async[\s\S]*?Corte de Caja'\n    \);\n  };/g,
  `const handleStartCorte = async (fondo: number) => {
    if (activeRegister) {
      alert('Ya existe un corte de caja abierto.');
      return;
    }
    await openRegister(fondo, 'Sucursal Principal', '');
    setShowNewCorteForm(false);
  };`
);

code = code.replace(
  /const handleCloseCorte = async[\s\S]*?bloqueados\.'\);\n  };/g,
  `const handleCloseCorte = async (efectivoContado: number, motivo: string) => {
    if (!activeRegister) return;
    
    // Filter orders created after the opening of this cut
    const cutOrders = orders.filter(o => new Date(o.createdAt).getTime() >= new Date(activeRegister.openedAt).getTime());
    
    // Calculate new metrics
    const vEfectivo = cutOrders.filter(o => o.channel === 'MOSTRADOR' && o.paymentMethod === 'efectivo' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vTarjeta = cutOrders.filter(o => o.channel === 'MOSTRADOR' && o.paymentMethod === 'tarjeta' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vTransferencia = cutOrders.filter(o => o.channel === 'MOSTRADOR' && o.paymentMethod === 'transferencia' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vUberPlataforma = cutOrders.filter(o => o.channel === 'UBER' && o.paymentMethod === 'plataforma' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vDidiPlataforma = cutOrders.filter(o => o.channel === 'DIDI' && o.paymentMethod === 'plataforma' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vDidiEfectivo = cutOrders.filter(o => o.channel === 'DIDI' && o.paymentMethod === 'efectivo' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    
    const canjes = cutOrders.filter(o => o.type === 'canje' && o.status !== 'cancelado').length;
    const cancelados = cutOrders.filter(o => o.status === 'cancelado').length;

    // Efectivo total esperado: Fondo + Ventas Efectivo Mostrador + Ventas Efectivo DiDi
    const totalEsperado = activeRegister.initialFloat + vEfectivo + vDidiEfectivo;
    const diferencia = efectivoContado - totalEsperado;

    if (diferencia !== 0 && !motivo.trim()) {
      alert('Es obligatorio ingresar un motivo de justificación cuando existe una diferencia de caja.');
      return;
    }

    await closeRegister({
      countedCash: efectivoContado,
      expectedCash: totalEsperado,
      difference,
      notes: motivo,
      ventasEfectivo: vEfectivo,
      ventasTarjeta: vTarjeta,
      ventasTransferencia: vTransferencia,
      ventasUberPlataforma: vUberPlataforma,
      ventasDidiPlataforma: vDidiPlataforma,
      ventasDidiEfectivo: vDidiEfectivo,
      canjesCount: canjes,
      canceladosCount: cancelados
    });

    setCorteEfectivoContado('');
    setCorteMotivoDiferencia('');
    
    alert('Corte de caja guardado, cerrado y auditado exitosamente. Los registros han sido bloqueados.');
  };`
);

// We also need to fix activeCorte -> activeRegister everywhere in RubricasGerencialesView.tsx
code = code.replace(/activeCorte/g, 'activeRegister');
code = code.replace(/cutsList/g, 'history');
code = code.replace(/fechaHoraApertura/g, 'openedAt');
code = code.replace(/cajeroResponsable/g, 'openedByName');
code = code.replace(/fondoInicial/g, 'initialFloat');

fs.writeFileSync('src/components/RubricasGerencialesView.tsx', code);
