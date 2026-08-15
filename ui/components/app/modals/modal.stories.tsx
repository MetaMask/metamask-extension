import type { Meta, StoryObj } from '@storybook/react';

import { Modal } from './modal';

const meta: Meta<typeof Modal> = {
  title: 'Components/App/Modals/Modal (deprecated)',
  component: Modal,
  parameters: {
    docs: { disable: true },
    layout: 'fullscreen',
  },
  args: {
    active: true,
    hideModal: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function createModalStory(modalName: string): Story {
  return {
    args: {
      modalState: { name: modalName },
    },
  };
}

export const HideTokenConfirmation = createModalStory(
  'HIDE_TOKEN_CONFIRMATION',
);
export const ConvertTokenToNft = createModalStory('CONVERT_TOKEN_TO_NFT');
export const RampsUnsupported = createModalStory('RAMPS_UNSUPPORTED');
export const RampsEligibilityFailed = createModalStory(
  'RAMPS_ELIGIBILITY_FAILED',
);
export const RampsServiceDisruption = createModalStory(
  'RAMPS_SERVICE_DISRUPTION',
);
export const QrScanner = createModalStory('QR_SCANNER');
export const CustomizeNonce = createModalStory('CUSTOMIZE_NONCE');
export const ConfirmTurnOnBackupAndSync = createModalStory(
  'CONFIRM_TURN_ON_BACKUP_AND_SYNC',
);
export const TurnOnBackupAndSync = createModalStory('TURN_ON_BACKUP_AND_SYNC');
export const NetworkManager = createModalStory('NETWORK_MANAGER');
