import React, { createContext, useContext } from 'react';
import { Customer, Reward, Order } from '../types';
import { useCustomerContext } from './CustomerContext';
import { useOrderContext } from './OrderContext';

interface ClubDelightContextType {
  customers: Customer[];
  rewards: Reward[];
  orders: Order[];
  addCustomer: (newCustomer: Customer) => Promise<void>;
  updateCustomer: (updatedCustomer: Customer) => Promise<void>;
}

const ClubDelightContext = createContext<ClubDelightContextType | undefined>(undefined);

export const ClubDelightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customers, addCustomer, updateCustomer } = useCustomerContext();
  const { rewards, orders } = useOrderContext();

  return (
    <ClubDelightContext.Provider value={{
      customers,
      rewards,
      orders,
      addCustomer,
      updateCustomer
    }}>
      {children}
    </ClubDelightContext.Provider>
  );
};

export const useClubDelightContext = () => {
  const context = useContext(ClubDelightContext);
  if (!context) throw new Error('useClubDelightContext must be used within a ClubDelightProvider');
  return context;
};
