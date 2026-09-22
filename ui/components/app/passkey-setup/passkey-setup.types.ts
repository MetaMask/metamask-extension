export type SetupPasskeyContentProps = {
  readonly onNext: () => void | Promise<void>;
  readonly onSkip?: () => void | Promise<void>;
  readonly password?: string;
  readonly isPasskeyRegistered?: boolean;
  readonly checkPasskeyPRFSupport?: boolean;
  readonly isPrfMigration?: boolean;
};

export type PasskeySetupStage = 'register' | 'verify' | 'enroll';

export type PasskeySetupOperation = (options: {
  password?: string;
  onStageChange?: (stage: PasskeySetupStage) => void;
}) => Promise<void>;
