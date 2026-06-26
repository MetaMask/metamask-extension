/** Props for the QRHardwareWalletImporter component. */
export type QRHardwareWalletImporterProps = {
  /** Called when the user cancels the QR wallet import flow. */
  handleCancel: () => void;
  /** Sets the popover title to an error-specific heading. */
  setErrorTitle: (title: string) => void;
  /** Signals the parent that the scanner is showing error content. */
  setErrorActive: (active: boolean) => void;
};
