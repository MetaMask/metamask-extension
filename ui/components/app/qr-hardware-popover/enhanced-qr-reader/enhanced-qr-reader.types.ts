/**
 * Props for {@link EnhancedQrReader}.
 */
export type EnhancedQrReaderProps = {
  /** Callback invoked with the decoded QR text on each successful frame. */
  onFrame: (data: string) => void;
};
