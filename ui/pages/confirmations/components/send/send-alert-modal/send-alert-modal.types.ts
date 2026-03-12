export type SendAlertModalProps = {
  isOpen: boolean;
  title: string;
  errorMessage: string;
  onAcknowledge: () => void;
  onClose: () => void;
};
