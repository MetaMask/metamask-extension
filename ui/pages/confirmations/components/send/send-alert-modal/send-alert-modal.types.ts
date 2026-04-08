import type { SendAlert } from '../../../hooks/send/alerts/types';

export type SendAlertModalProps = {
  isOpen: boolean;
  alerts: SendAlert[];
  onAcknowledge: () => void;
  onClose: () => void;
};
