import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CashRegister, CashMovement } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useSystemContext } from './SystemContext';

interface CashContextType {
  activeRegister: CashRegister | null;
  movements: CashMovement[];
  openRegister: (initialCash: number, openedBy: string, branchId: string) => Promise<void>;
  closeRegister: (actualCash: number, closedBy: string, notes?: string) => Promise<void>;
  addMovement: (type: 'IN' | 'OUT', amount: number, reason: string, userId: string) => Promise<void>;
  loading: boolean;
}

const CashContext = createContext<CashContextType | undefined>(undefined);

export function CashProvider({ children }: { children: ReactNode }) {
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { systemConfig } = useSystemContext();
  
  useEffect(() => {
    if (isSupabaseConfigured) {
      loadActiveRegister();
    } else {
      setLoading(false);
    }
  }, []);

  const loadActiveRegister = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from('cash_registers')
        .select('*')
        .eq('status', 'OPEN')
        .eq('branch_id', systemConfig?.ticket?.businessName || 'default')
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading active register:', error);
      } else if (data) {
        setActiveRegister(data as CashRegister);
        loadMovements(data.id);
      } else {
        setActiveRegister(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async (registerId: string) => {
    try {
      const { data, error } = await supabase!
        .from('cash_movements')
        .select('*')
        .eq('register_id', registerId)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setMovements(data as CashMovement[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openRegister = async (initialCash: number, openedBy: string, branchId: string) => {
    if (!isSupabaseConfigured) {
      const mockRegister: CashRegister = {
        id: crypto.randomUUID(),
        branch_id: branchId,
        opened_by: openedBy,
        opened_at: new Date().toISOString(),
        initial_cash: initialCash,
        status: 'OPEN'
      };
      setActiveRegister(mockRegister);
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('cash_registers')
        .insert({
          branch_id: branchId,
          opened_by: openedBy,
          initial_cash: initialCash,
          status: 'OPEN'
        })
        .select()
        .single();

      if (error) throw error;
      setActiveRegister(data as CashRegister);
      setMovements([]);
    } catch (e) {
      console.error('Error opening register:', e);
      throw e;
    }
  };

  const closeRegister = async (actualCash: number, closedBy: string, notes?: string) => {
    if (!activeRegister) return;
    
    if (!isSupabaseConfigured) {
      setActiveRegister(null);
      return;
    }

    try {
      // expected_cash needs to be calculated by total cash sales + initial + inputs - outputs
      // For now we just close it and let the server/UI calculate expected.
      // But we should fetch orders to calculate.
      // Assuming we have it calculated before calling this:
      const { error } = await supabase!
        .from('cash_registers')
        .update({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
          closed_by: closedBy,
          actual_cash: actualCash,
          notes: notes
        })
        .eq('id', activeRegister.id);

      if (error) throw error;
      setActiveRegister(null);
      setMovements([]);
    } catch (e) {
      console.error('Error closing register:', e);
      throw e;
    }
  };

  const addMovement = async (type: 'IN' | 'OUT', amount: number, reason: string, userId: string) => {
    if (!activeRegister) throw new Error('No active register');
    
    if (!isSupabaseConfigured) {
      const mockMov: CashMovement = {
        id: crypto.randomUUID(),
        register_id: activeRegister.id,
        type,
        amount,
        reason,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      setMovements([mockMov, ...movements]);
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('cash_movements')
        .insert({
          register_id: activeRegister.id,
          type,
          amount,
          reason,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      setMovements([data as CashMovement, ...movements]);
    } catch (e) {
      console.error('Error adding movement:', e);
      throw e;
    }
  };

  return (
    <CashContext.Provider value={{ activeRegister, movements, openRegister, closeRegister, addMovement, loading }}>
      {children}
    </CashContext.Provider>
  );
}

export function useCash() {
  const context = useContext(CashContext);
  if (context === undefined) {
    throw new Error('useCash must be used within a CashProvider');
  }
  return context;
}
