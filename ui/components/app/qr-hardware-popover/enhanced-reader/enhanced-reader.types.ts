/**
 * Props for {@link EnhancedReader}.
 */
export type EnhancedReaderProps = {
  /** Callback invoked with the decoded QR text on each successful frame. */
  onFrame: (data: string) => void;
  /** Callback invoked when the camera stream encounters an error. */
  onCameraError?: (error: Error) => void;
};
