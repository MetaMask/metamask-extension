import type { ReactNode } from 'react';

export type AccountStatusLayoutProps = {
  /** Test id for the root container */
  dataTestId: string;
  /** i18n key for the page title */
  titleKey: string;
  /** i18n key for the description (supports interpolation) */
  descriptionKey: string;
  /** Interpolation values for the description (e.g. [userEmail]) */
  descriptionInterpolation?: (string | ReactNode)[];
  /** i18n key for the primary button label */
  primaryButtonTextKey: string;
  /** Called when the primary button is clicked */
  onPrimaryButtonClick: () => void;
  /** i18n key for the secondary button label */
  secondaryButtonTextKey: string;
  /** Called when the secondary button is clicked */
  onSecondaryButtonClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
};
