export type QrSyncSimulatorAction =
  | 'mobileScanned'
  | 'deliverSyncOffer'
  | 'deliverSyncCompleted'
  | 'deliverSyncCancel'
  | 'deliverSyncError'
  | 'reset';

export type SimulatorParams = {
  otp?: string;
  isOnboardingCompleted?: boolean;
  sessionId?: string;
  errorMessage?: string;
};

export type SimulatorState = {
  sessionId: string | null;
  otp: string;
  otpDeadline: number | null;
  isConnected: boolean;
  lastSyncReadyPayload: unknown | null;
};
