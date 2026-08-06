import React, { createContext, useContext } from 'react';
import { useMailbox } from '../hooks/useMailbox';

type MailboxContextType = ReturnType<typeof useMailbox>;

const MailboxContext = createContext<MailboxContextType | null>(null);

export const MailboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mailboxValue = useMailbox();

  return (
    <MailboxContext.Provider value={mailboxValue}>
      {children}
    </MailboxContext.Provider>
  );
};

export const useMailboxContext = () => {
  const context = useContext(MailboxContext);
  if (!context) {
    throw new Error('useMailboxContext must be used within MailboxProvider');
  }
  return context;
};
