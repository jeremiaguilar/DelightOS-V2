import React from 'react';
import { SystemProvider } from '../contexts/SystemContext';
import { UserProvider } from '../contexts/UserContext';
import { ConfigProvider } from '../contexts/ConfigContext';
import { CustomerProvider } from '../contexts/CustomerContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { OrderProvider } from '../contexts/OrderContext';
import { KDSProvider } from '../contexts/KDSContext';
import { ClubDelightProvider } from '../contexts/ClubDelightContext';
import { CashRegisterProvider } from '../contexts/CashRegisterContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <SystemProvider>
      <ConfigProvider>
        <UserProvider>
          <CustomerProvider>
            <InventoryProvider>
              <CashRegisterProvider>
                <OrderProvider>
                  <KDSProvider>
                    <ClubDelightProvider>{children}</ClubDelightProvider>
                  </KDSProvider>
                </OrderProvider>
              </CashRegisterProvider>
            </InventoryProvider>
          </CustomerProvider>
        </UserProvider>
      </ConfigProvider>
    </SystemProvider>
  );
}
