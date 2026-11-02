import type { PasskeyStage } from '../../../../shared/constants/passkey';

export type SetupPasskeyContentProps = {
  readonly onNext: () => void | Promise<void>;
  readonly onSkip?: () => void | Promise<void>;
  readonly password?: string;
  readonly isPasskeyRegistered?: boolean;
  readonly checkPasskeyPRFSupport?: boolean;
  readonly isPrfMigration?: boolean;
};

export type PasskeySetupOperation = (options: {
  password?: string;
  onStageChange?: (stage: PasskeyStage) => void;
}) => Promise<void>;
