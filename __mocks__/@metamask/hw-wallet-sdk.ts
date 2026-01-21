/**
 * Mock for @metamask/hw-wallet-sdk
 * Used in tests when the actual module is not available
 */

export enum ErrorCode {
  AuthenticationDeviceLocked = 'AuthenticationDeviceLocked',
  DeviceStateEthAppClosed = 'DeviceStateEthAppClosed',
  ConnectionTransportMissing = 'ConnectionTransportMissing',
  ConnectionTimeout = 'ConnectionTimeout',
}

export enum Severity {
  Err = 'Err',
  Warn = 'Warn',
  Info = 'Info',
}

export enum Category {
  Authentication = 'Authentication',
  DeviceState = 'DeviceState',
  Connection = 'Connection',
  Protocol = 'Protocol',
}

export interface HardwareWalletErrorOptions {
  code: ErrorCode;
  severity: Severity;
  category: Category;
  userMessage: string;
}

export class HardwareWalletError extends Error {
  code: ErrorCode;

  severity: Severity;

  category: Category;

  userMessage: string;

  constructor(message: string, options: HardwareWalletErrorOptions) {
    super(message);
    this.name = 'HardwareWalletError';
    this.code = options.code;
    this.severity = options.severity;
    this.category = options.category;
    this.userMessage = options.userMessage;
  }
}
