/**
 * A note about the existence of both singular and plural variable names here:
 * When dealing with a literal property name, e.g. AlignItems, the constant
 * should match the property. When detailing a collection of things, it should
 * match the plural form of the thing. e.g. Color, TextVariant, Size
 */

export enum Color {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundDefault = 'background-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundAlternative = 'background-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundMuted = 'background-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  textDefault = 'text-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  textAlternative = 'text-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  textMuted = 'text-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconDefault = 'icon-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconAlternative = 'icon-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconMuted = 'icon-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  borderDefault = 'border-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  borderMuted = 'border-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  overlayDefault = 'overlay-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  overlayInverse = 'overlay-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryDefault = 'primary-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryAlternative = 'primary-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryMuted = 'primary-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryInverse = 'primary-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorDefault = 'error-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorAlternative = 'error-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorMuted = 'error-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorInverse = 'error-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningDefault = 'warning-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningMuted = 'warning-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningInverse = 'warning-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successDefault = 'success-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successMuted = 'success-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successInverse = 'success-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoDefault = 'info-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoMuted = 'info-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoInverse = 'info-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerli = 'goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepolia = 'sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerli = 'linea-goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerliInverse = 'linea-goerli-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepolia = 'linea-sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepoliaInverse = 'linea-sepolia-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnet = 'linea-mainnet',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnetInverse = 'linea-mainnet-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transparent = 'transparent',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  localhost = 'localhost',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  inherit = 'inherit',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerliInverse = 'goerli-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepoliaInverse = 'sepolia-inverse',
}

export enum BackgroundColor {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundDefault = 'background-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundAlternative = 'background-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundMuted = 'background-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundSection = 'background-section',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundSubsection = 'background-subsection',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundAlternativeSoft = 'background-alternative-soft',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundHover = 'background-hover',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundPressed = 'background-pressed',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconDefault = 'icon-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconAlternative = 'icon-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconMuted = 'icon-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  overlayDefault = 'overlay-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  overlayAlternative = 'overlay-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryDefault = 'primary-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryAlternative = 'primary-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryMuted = 'primary-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorDefault = 'error-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorAlternative = 'error-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorMuted = 'error-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningDefault = 'warning-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningMuted = 'warning-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successDefault = 'success-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successMuted = 'success-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoDefault = 'info-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoMuted = 'info-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mainnet = 'mainnet',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerli = 'goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepolia = 'sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerli = 'linea-goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepolia = 'linea-sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnet = 'linea-mainnet',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transparent = 'transparent',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  localhost = 'localhost',
}

export enum BorderColor {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  borderDefault = 'border-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  borderMuted = 'border-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryDefault = 'primary-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryAlternative = 'primary-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryMuted = 'primary-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorDefault = 'error-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorAlternative = 'error-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorMuted = 'error-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningDefault = 'warning-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningMuted = 'warning-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successDefault = 'success-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successMuted = 'success-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoDefault = 'info-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoMuted = 'info-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mainnet = 'mainnet',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerli = 'goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepolia = 'sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerli = 'linea-goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepolia = 'linea-sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnet = 'linea-mainnet',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transparent = 'transparent',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  localhost = 'localhost',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  backgroundDefault = 'background-default', // exception for border color when element is meant to look "cut out"
}

export enum TextColor {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  textDefault = 'text-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  textAlternative = 'text-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  textAlternativeSoft = 'text-alternative-soft',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  textMuted = 'text-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconDefault = 'icon-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconAlternative = 'icon-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconMuted = 'icon-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconInverse = 'icon-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  overlayInverse = 'overlay-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryDefault = 'primary-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryInverse = 'primary-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorDefault = 'error-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorAlternative = 'error-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorInverse = 'error-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successDefault = 'success-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successInverse = 'success-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningDefault = 'warning-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningInverse = 'warning-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoDefault = 'info-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoInverse = 'info-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  inherit = 'inherit',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerli = 'goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepolia = 'sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerli = 'linea-goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerliInverse = 'linea-goerli-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepolia = 'linea-sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepoliaInverse = 'linea-sepolia-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnet = 'linea-mainnet',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnetInverse = 'linea-mainnet-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerliInverse = 'goerli-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepoliaInverse = 'sepolia-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transparent = 'transparent',
}

export enum IconColor {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconDefault = 'icon-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconAlternative = 'icon-alternative',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconAlternativeSoft = 'icon-alternative-soft',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconMuted = 'icon-muted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iconInverse = 'icon-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  overlayInverse = 'overlay-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryDefault = 'primary-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  primaryInverse = 'primary-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorDefault = 'error-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errorInverse = 'error-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successDefault = 'success-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  successInverse = 'success-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningDefault = 'warning-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  warningInverse = 'warning-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoDefault = 'info-default',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  infoInverse = 'info-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  inherit = 'inherit',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerli = 'goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepolia = 'sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerli = 'linea-goerli',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaGoerliInverse = 'linea-goerli-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepolia = 'linea-sepolia',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaSepoliaInverse = 'linea-sepolia-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnet = 'linea-mainnet',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lineaMainnetInverse = 'linea-mainnet-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  goerliInverse = 'goerli-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sepoliaInverse = 'sepolia-inverse',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transparent = 'transparent',
}

export enum TypographyVariant {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6',
  H7 = 'h7',
  H8 = 'h8',
  H9 = 'h9',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  paragraph = 'p',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  span = 'span',
}

export enum TextVariant {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  displayMd = 'display-md',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headingLg = 'heading-lg',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headingMd = 'heading-md',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headingSm = 'heading-sm',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodyLgMedium = 'body-lg-medium',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodyMd = 'body-md',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodyMdMedium = 'body-md-medium',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodyMdBold = 'body-md-bold',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodySm = 'body-sm',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodySmMedium = 'body-sm-medium',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodySmBold = 'body-sm-bold',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodyXs = 'body-xs',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bodyXsMedium = 'body-xs-medium',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  inherit = 'inherit',
}

export enum Size {
  XXS = 'xxs',
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  inherit = 'inherit', // Used for Text, Icon, and Button components to inherit the parent elements font-size
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  auto = 'auto',
}

export enum BorderStyle {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dashed = 'dashed',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  solid = 'solid',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dotted = 'dotted',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  double = 'double',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  none = 'none',
}

export enum BorderRadius {
  /**
   * 2px
   */
  XS = 'xs',
  /**
   * 4px
   */
  SM = 'sm',
  /**
   * 6px
   */
  MD = 'md',
  /**
   * 8px
   */
  LG = 'lg',
  /**
   * 12px
   */
  XL = 'xl',
  /**
   * 0
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  none = 'none',
  /**
   * 9999px
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  pill = 'pill',
  /**
   * 50%
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  full = 'full',
}

// NOTE: The name of this enum is plural due to the name of property in css is `align-items`,
// which is for aligning all items not one
export enum AlignItems {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  flexStart = 'flex-start',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  flexEnd = 'flex-end',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  center = 'center',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  baseline = 'baseline',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  stretch = 'stretch',
}

export enum JustifyContent {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  flexStart = 'flex-start',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  flexEnd = 'flex-end',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  center = 'center',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  spaceAround = 'space-around',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  spaceBetween = 'space-between',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  spaceEvenly = 'space-evenly',
}

export enum FlexDirection {
  Row = 'row',
  RowReverse = 'row-reverse',
  Column = 'column',
  ColumnReverse = 'column-reverse',
}

/**
 * @deprecated `FLEX_DIRECTION` const has been deprecated in favor of the `FlexDirection` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `FLEX_DIRECTION` with `FlexDirection` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */

export const FLEX_DIRECTION = {
  ROW: 'row',
  ROW_REVERSE: 'row-reverse',
  COLUMN: 'column',
  COLUMN_REVERSE: 'column-reverse',
};

export enum FlexWrap {
  Wrap = 'wrap',
  WrapReverse = 'wrap-reverse',
  NoWrap = 'nowrap',
}

/**
 * @deprecated `FLEX_WRAP` const has been deprecated in favor of the `FlexWrap` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `FLEX_WRAP` with `FlexWrap` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */

export const FLEX_WRAP = {
  WRAP: 'wrap',
  WRAP_REVERSE: 'wrap-reverse',
  NO_WRAP: 'nowrap',
};

export enum Display {
  Block = 'block',
  Flex = 'flex',
  Grid = 'grid',
  InlineBlock = 'inline-block',
  Inline = 'inline',
  InlineFlex = 'inline-flex',
  InlineGrid = 'inline-grid',
  ListItem = 'list-item',
  None = 'none',
}

/**
 * @deprecated `DISPLAY` const has been deprecated in favor of the `Display` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `DISPLAY` with `Display` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */

export const DISPLAY = {
  BLOCK: 'block',
  FLEX: 'flex',
  GRID: 'grid',
  INLINE_BLOCK: 'inline-block',
  INLINE: 'inline',
  INLINE_FLEX: 'inline-flex',
  INLINE_GRID: 'inline-grid',
  LIST_ITEM: 'list-item',
  NONE: 'none',
};

/**
 * @deprecated `FRACTIONS` const has been deprecated in favor of the `BlockSize` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `FRACTIONS` with `BlockSize` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */

export const FRACTIONS = {
  HALF: '1/2',
  ONE_THIRD: '1/3',
  TWO_THIRDS: '2/3',
  ONE_FOURTH: '1/4',
  TWO_FOURTHS: '2/4',
  THREE_FOURTHS: '3/4',
  ONE_FIFTH: '1/5',
  TWO_FIFTHS: '2/5',
  THREE_FIFTHS: '3/5',
  FOUR_FIFTHS: '4/5',
  ONE_SIXTH: '1/6',
  TWO_SIXTHS: '2/6',
  THREE_SIXTHS: '3/6',
  FOUR_SIXTHS: '4/6',
  FIVE_SIXTHS: '5/6',
  ONE_TWELFTH: '1/12',
  TWO_TWELFTHS: '2/12',
  THREE_TWELFTHS: '3/12',
  FOUR_TWELFTHS: '4/12',
  FIVE_TWELFTHS: '5/12',
  SIX_TWELFTHS: '6/12',
  SEVEN_TWELFTHS: '7/12',
  EIGHT_TWELFTHS: '8/12',
  NINE_TWELFTHS: '9/12',
  TEN_TWELFTHS: '10/12',
  ELEVEN_TWELFTHS: '11/12',
};

export enum BlockSize {
  Zero = '0',
  Half = '1/2',
  OneThird = '1/3',
  TwoThirds = '2/3',
  OneFourth = '1/4',
  TwoFourths = '2/4',
  ThreeFourths = '3/4',
  OneFifth = '1/5',
  TwoFifths = '2/5',
  ThreeFifths = '3/5',
  FourFifths = '4/5',
  OneSixth = '1/6',
  TwoSixths = '2/6',
  ThreeSixths = '3/6',
  FourSixths = '4/6',
  FiveSixths = '5/6',
  OneTwelfth = '1/12',
  TwoTwelfths = '2/12',
  ThreeTwelfths = '3/12',
  FourTwelfths = '4/12',
  FiveTwelfths = '5/12',
  SixTwelfths = '6/12',
  SevenTwelfths = '7/12',
  EightTwelfths = '8/12',
  NineTwelfths = '9/12',
  TenTwelfths = '10/12',
  ElevenTwelfths = '11/12',
  Screen = 'screen',
  Max = 'max',
  Min = 'min',
  Full = 'full',
}

/**
 * @deprecated `BLOCK_SIZES` const has been deprecated in favor of the `BlockSize` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `BLOCK_SIZES` with `BlockSize` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */

export const BLOCK_SIZES = {
  ...FRACTIONS,
  SCREEN: 'screen',
  MAX: 'max',
  MIN: 'min',
  FULL: 'full',
};

export enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',
  End = 'end',
  Start = 'start',
}

/**
 * @deprecated `TEXT_ALIGN` const has been deprecated in favor of the `TextAlign` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `TEXT_ALIGN` with `TextAlign` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const TEXT_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify',
  END: 'end',
  START: 'start',
};

export enum TextTransform {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Uppercase = 'uppercase',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Lowercase = 'lowercase',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Capitalize = 'capitalize',
}

/**
 * @deprecated `TEXT_TRANSFORM` const has been deprecated in favor of the `TextTransform` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `TEXT_TRANSFORM` with `TextTransform` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const TEXT_TRANSFORM = {
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
};

export enum FontWeight {
  Bold = 'bold',
  Medium = 'medium',
  Normal = 'normal',
}

export enum FontFamily {
  Default = 'default', // Geist
  Accent = 'accent', // MMSans
  Hero = 'hero', // MMPoly
}

/**
 * @deprecated `FONT_WEIGHT` const has been deprecated in favor of the `FontWeight` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `FONT_WEIGHT` with `FontWeight` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const FONT_WEIGHT = {
  BOLD: 'bold',
  MEDIUM: 'medium',
  NORMAL: 'normal',
};

export enum OverflowWrap {
  BreakWord = 'break-word',
  Anywhere = 'anywhere',
  Normal = 'normal',
}

/**
 * @deprecated `OVERFLOW_WRAP` const has been deprecated in favor of the `OverflowWrap` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `OVERFLOW_WRAP` with `OverflowWrap` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const OVERFLOW_WRAP = {
  BREAK_WORD: 'break-word',
  ANYWHERE: 'anywhere',
  NORMAL: 'normal',
};

export enum FontStyle {
  Italic = 'italic',
  Normal = 'normal',
}

/**
 * @deprecated `FONT_STYLE` const has been deprecated in favor of the `FontStyle` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `FONT_STYLE` with `FontStyle` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */
export const FONT_STYLE = {
  ITALIC: 'italic',
  NORMAL: 'normal',
};

export enum Severity {
  Danger = 'danger',
  Warning = 'warning',
  Info = 'info',
  Success = 'success',
}

/**
 * @deprecated `SEVERITIES` const has been deprecated in favor of the `Severity` enum which can still be imported from `ui/helpers/constants/design-system.ts`
 *
 * Help to replace `SEVERITIES` with `FontStyle` by submitting PRs against https://github.com/MetaMask/metamask-extension/issues/18714
 */

export const SEVERITIES = {
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
};

export const BREAKPOINTS = ['base', 'sm', 'md', 'lg'];
