import * as React from 'react';

export type MetafoxLogoProps = {
  onClick?: (() => void) | (() => Promise<void>);
  unsetIconHeight?: boolean;
  isOnboarding?: boolean;
  src?: string;
  theme?: string;
};

declare const MetafoxLogo: React.ComponentType<MetafoxLogoProps>;

export default MetafoxLogo;
