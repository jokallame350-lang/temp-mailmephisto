import React, { createContext, useContext } from 'react';
import { useEmails } from '../hooks/useEmails';
import { useMailboxContext } from './MailboxContext';
import { useToast } from './ToastContext';

type EmailContextType = ReturnType<typeof useEmails>;

const EmailContext = createContext<EmailContextType | null>(null);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeAccount } = useMailboxContext();
  const { addToast } = useToast();
  const emailValue = useEmails(activeAccount, addToast);

  return (
    <EmailContext.Provider value={emailValue}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmailContext = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmailContext must be used within EmailProvider');
  }
  return context;
};
