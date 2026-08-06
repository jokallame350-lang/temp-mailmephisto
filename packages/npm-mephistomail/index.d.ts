export interface MephistoInbox {
  id: string;
  address: string;
  domain: string;
  createdAt: number;
  getMessages(): Promise<any[]>;
  waitForOTP(timeoutMs?: number): Promise<string>;
}

export interface MephistoOptions {
  apiBase?: string;
}

export class MephistoMail {
  constructor(options?: MephistoOptions);
  createInbox(customUsername?: string | null): Promise<MephistoInbox>;
  getMessages(address: string): Promise<any[]>;
  waitForOTP(address: string, timeoutMs?: number): Promise<string>;
}

export default MephistoMail;
