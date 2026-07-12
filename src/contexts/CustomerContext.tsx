import React, { createContext, useContext } from 'react';
import { Customer } from '../types';
import { useSystemContext } from './SystemContext';
import { customerService } from '../services/customerService';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (newCustomer: Customer) => Promise<void>;
  updateCustomer: (updatedCustomer: Customer) => Promise<void>;
  setCustomersState: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customers, setCustomers, addAuditLog, registerSyncAction } = useSystemContext();

  const addCustomer = async (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    
    await addAuditLog(
      'Crear Socio', 
      'N/A', 
      `Socio DL-${newCustomer.id}: ${newCustomer.name} ${newCustomer.lastName} (Cel: ${newCustomer.phone})`, 
      'Club DELIGHT'
    );

    await customerService.addCustomer(newCustomer, registerSyncAction);
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    const prevCust = customers.find(c => c.id === updatedCustomer.id);
    const prevDetails = prevCust ? `${prevCust.name} ${prevCust.lastName} (Pts: ${prevCust.pointsAvailable})` : 'N/D';
    
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    
    await addAuditLog(
      'Editar Socio', 
      prevDetails, 
      `${updatedCustomer.name} ${updatedCustomer.lastName} (Pts: ${updatedCustomer.pointsAvailable})`, 
      'Club DELIGHT'
    );

    await customerService.updateCustomer(updatedCustomer, registerSyncAction);
  };

  return (
    <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, setCustomersState: setCustomers }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomerContext must be used within a CustomerProvider');
  return context;
};
