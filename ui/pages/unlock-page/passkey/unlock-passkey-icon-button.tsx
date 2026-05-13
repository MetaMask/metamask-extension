import React from 'react';
import {
  ButtonIcon,
  ButtonIconVariant,
  IconName,
  ButtonIconSize,
  IconColor,
  IconSize,
} from '@metamask/design-system-react';
import { getPasskeyAuthMethodKey } from '../../../../shared/lib/passkey';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type UnlockPasskeyIconButtonProps = {
  disabled: boolean;
  onClick: () => void;
};

export const UnlockPasskeyIconButton = ({
  disabled,
  onClick,
}: UnlockPasskeyIconButtonProps) => {
  const t = useI18nContext() as (key: string, ...args: unknown[]) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());

  return (
    <ButtonIcon
      variant={ButtonIconVariant.Filled}
      ariaLabel={t('unlockWithPasskey', [passkeyMethodLabel])}
      data-testid="unlock-with-passkey"
      iconName={IconName.Fingerprint}
      size={ButtonIconSize.Lg}
      color={IconColor.IconAlternative}
      iconProps={{
        color: IconColor.IconAlternative,
        size: IconSize.Lg,
      }}
      className="flex self-start mb-4 h-12 w-12 rounded-lg"
      disabled={disabled}
      onClick={onClick}
      type="button"
    />
  );
};
