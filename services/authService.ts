import { Mailbox } from '../types';

export interface UserProfile {
  email: string;
  password: string;
  savedMailboxes: Mailbox[];
}

const USERS_KEY = 'mephisto_user_accounts';

export const registerWithRealEmail = async (email: string, pass: string): Promise<UserProfile> => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  
  if (users.find((u: UserProfile) => u.email === email)) {
    throw new Error("Bu email adresi zaten kayıtlı.");
  }

  const newUser: UserProfile = { email, password: pass, savedMailboxes: [] };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  return newUser;
};

export const loginWithRealEmail = async (email: string, pass: string): Promise<UserProfile> => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u: UserProfile) => u.email === email && u.password === pass);

  if (!user) {
    throw new Error("Hatalı email veya şifre.");
  }

  return user;
};