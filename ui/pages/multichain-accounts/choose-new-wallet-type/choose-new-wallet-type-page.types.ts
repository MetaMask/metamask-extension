import { IconName } from '@metamask/design-system-react';

export type WalletTypeOption = {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  iconName: IconName;
  onClick: () => void;
};
