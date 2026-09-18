/** Props for the QrPlayer component. */
export type QrPlayerProps = {
  /** UR type identifier, e.g. "eth-sign-request". */
  type: string;
  /** Hex-encoded CBOR payload to embed in the QR code. */
  cbor: string;
  /** Called when the user cancels the QR signing request. */
  cancelQRHardwareSignRequest: () => void;
  /** Advances the flow to the camera scan phase. */
  toRead: () => void;
};

/** QR code display constants for the animated QrPlayer. */
export const QR_PLAYER_CONFIG = {
  /** Maximum size in bytes of each UR fragment. */
  FRAGMENT_SIZE: 200,
  /** Interval in milliseconds between QR code frame rotations. */
  REFRESH_RATE: 200,
  /** Pixel size of the rendered QR code SVG. */
  CODE_SIZE: 210,
} as const;
