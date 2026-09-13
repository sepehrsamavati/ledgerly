import React, { createContext, useContext, useMemo } from 'react';
import { LedgerRepository, IndexedDBRepository, ServerHttpRepository } from '@ledgerly/storage';
import { getAppConfig } from '../config/index';

const RepositoryContext = createContext<LedgerRepository | null>(null);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repository = useMemo(() => {
    const config = getAppConfig();
    if (config.mode === 'backend' && config.apiBaseUrl) {
      return new ServerHttpRepository(config.apiBaseUrl);
    }
    return new IndexedDBRepository();
  }, []);

  return (
    <RepositoryContext.Provider value={repository}>
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepository = (): LedgerRepository => {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error('useRepository must be used within RepositoryProvider');
  return repo;
};
