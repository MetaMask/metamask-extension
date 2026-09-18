import type { SendAlert } from '../../../hooks/send/alerts/types';

export type SendAlertModalProps = {
  isOpen: boolean;
  alerts: SendAlert[];
  onAcknowledge: (acknowledgedKeys: string[]) => void;
  onClose: () => void;
  acknowledgeLabel?: string;
};
