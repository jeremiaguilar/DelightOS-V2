import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserContext } from './UserContext';
import { useSystemContext } from './SystemContext';

export interface CashRegisterSession {
  movements?: any[];
  id: string;
  openedAt: string;
  openedBy: string;
  openedByName: string;
  initialFloat: number;
  branch: string;
  notes: string;
  status: 'abierta' | 'cerrada';
  closedAt?: string;
  closedBy?: string;
  closedByName?: string;
  expectedCash?: number;
  countedCash?: number;
  difference?: number;
  closingNotes?: string;
  ventasEfectivo?: number;
  ventasTarjeta?: number;
  ventasTransferencia?: number;
  ventasUberPlataforma?: number;
  ventasDidiPlataforma?: number;
  ventasDidiEfectivo?: number;
  canjesCount?: number;
  canceladosCount?: number;
}

interface CashRegisterContextType {
  activeRegister: CashRegisterSession | null;
  openRegister: (float: number, branch: string, notes: string) => Promise<void>;
  closeRegister: (metrics: any) => Promise<void>;
  updateHistoryRecord: (id: string, updates: Partial<CashRegisterSession>) => void;
  isLoading: boolean;
  history: CashRegisterSession[];
}

const CashRegisterContext = createContext<CashRegisterContextType | undefined>(undefined);

export const CashRegisterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useUserContext();
  const { addAuditLog } = useSystemContext();
  const [activeRegister, setActiveRegister] = useState<CashRegisterSession | null>(null);
  const [history, setHistory] = useState<CashRegisterSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegisters();
  }, []);

  const loadRegisters = async () => {
    try {
      setIsLoading(true);
      // Load from local storage / indexedDB first
      const storedData = localStorage.getItem('delight_cash_registers');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setHistory(parsed);
        const open = parsed.find((r: any) => r.status === 'abierta');
        if (open) setActiveRegister(open);
      }
      
      // Try to load from Supabase if active
      if (supabase) {
        const { data, error } = await supabase.from('cash_registers').select('*').order('opened_at', { ascending: false });
        if (!error && data) {
          const formatted = data.map((d: any) => ({
            id: d.id,
            openedAt: d.opened_at,
            openedBy: d.opened_by,
            openedByName: d.opened_by_name,
            initialFloat: d.initial_float,
            branch: d.branch,
            notes: d.notes,
            status: d.status,
            closedAt: d.closed_at,
            closedBy: d.closed_by,
            closedByName: d.closed_by_name,
            expectedCash: d.expected_cash,
            countedCash: d.counted_cash,
            difference: d.difference,
            closingNotes: d.closing_notes
          }));
          setHistory(formatted);
          localStorage.setItem('delight_cash_registers', JSON.stringify(formatted));
          const open = formatted.find((r: any) => r.status === 'abierta');
          setActiveRegister(open || null);
        }
      }
    } catch (error) {
      console.error('Error loading registers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openRegister = async (float: number, branch: string, notes: string) => {
    if (!currentUser) return;
    
    const newRegister: CashRegisterSession = {
      id: crypto.randomUUID(),
      openedAt: new Date().toISOString(),
      openedBy: currentUser.id,
      openedByName: currentUser.name,
      initialFloat: float,
      branch,
      notes,
      status: 'abierta'
    };

    setActiveRegister(newRegister);
    const newHistory = [newRegister, ...history];
    setHistory(newHistory);
    localStorage.setItem('delight_cash_registers', JSON.stringify(newHistory));

    if (supabase) {
      await supabase.from('cash_registers').insert({
        id: newRegister.id,
        opened_at: newRegister.openedAt,
        opened_by: newRegister.openedBy,
        opened_by_name: newRegister.openedByName,
        initial_float: newRegister.initialFloat,
        branch: newRegister.branch,
        notes: newRegister.notes,
        status: newRegister.status
      });
    }

    await addAuditLog(
      'Apertura de Caja',
      'Caja Cerrada',
      `Fondo: $${float}, Sucursal: ${branch}`,
      'Caja'
    );
  };

  const updateHistoryRecord = (id: string, updates: Partial<CashRegisterSession>) => {
    const newHistory = history.map(r => r.id === id ? { ...r, ...updates } : r);
    setHistory(newHistory);
    localStorage.setItem('delight_cash_registers', JSON.stringify(newHistory));
  };

  const closeRegister = async (metrics: any) => {
    if (!activeRegister || !currentUser) return;

    const closedRegister: CashRegisterSession = {
      ...activeRegister,
      status: 'cerrada',
      closedAt: new Date().toISOString(),
      closedBy: currentUser.id,
      closedByName: currentUser.name,
      expectedCash: metrics.expectedCash,
      countedCash: metrics.countedCash,
      difference: metrics.difference,
      closingNotes: metrics.notes,
      ventasEfectivo: metrics.ventasEfectivo,
      ventasTarjeta: metrics.ventasTarjeta,
      ventasTransferencia: metrics.ventasTransferencia,
      ventasUberPlataforma: metrics.ventasUberPlataforma,
      ventasDidiPlataforma: metrics.ventasDidiPlataforma,
      ventasDidiEfectivo: metrics.ventasDidiEfectivo,
      canjesCount: metrics.canjesCount,
      canceladosCount: metrics.canceladosCount
    };

    setActiveRegister(null);
    const newHistory = history.map(r => r.id === closedRegister.id ? closedRegister : r);
    setHistory(newHistory);
    localStorage.setItem('delight_cash_registers', JSON.stringify(newHistory));

    if (supabase) {
      await supabase.from('cash_registers').update({
        status: closedRegister.status,
        closed_at: closedRegister.closedAt,
        closed_by: closedRegister.closedBy,
        closed_by_name: closedRegister.closedByName,
        expected_cash: closedRegister.expectedCash,
        counted_cash: closedRegister.countedCash,
        difference: closedRegister.difference,
        closing_notes: closedRegister.closingNotes,
        metrics: {
          ventasEfectivo: closedRegister.ventasEfectivo,
          ventasTarjeta: closedRegister.ventasTarjeta,
          ventasTransferencia: closedRegister.ventasTransferencia,
          ventasUberPlataforma: closedRegister.ventasUberPlataforma,
          ventasDidiPlataforma: closedRegister.ventasDidiPlataforma,
          ventasDidiEfectivo: closedRegister.ventasDidiEfectivo,
          canjesCount: closedRegister.canjesCount,
          canceladosCount: closedRegister.canceladosCount
        }
      }).eq('id', closedRegister.id);
    }

    await addAuditLog(
      'Cierre de Caja',
      `Fondo: $${activeRegister.initialFloat}`,
      `Efectivo Contado: ${metrics.countedCash} (Dif: ${metrics.difference})`,
      'Caja'
    );
  };

  return (
    <CashRegisterContext.Provider value={{ activeRegister, openRegister, closeRegister, updateHistoryRecord, isLoading, history }}>
      {children}
    </CashRegisterContext.Provider>
  );
};

export const useCashRegisterContext = () => {
  const context = useContext(CashRegisterContext);
  if (!context) throw new Error('useCashRegisterContext must be used within a CashRegisterProvider');
  return context;
};
