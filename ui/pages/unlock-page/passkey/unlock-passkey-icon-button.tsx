import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  ButtonIcon,
  ButtonIconVariant,
  IconName,
  ButtonIconSize,
  IconColor,
  IconSize,
} from '@metamask/design-system-react';
import { getPasskeyAuthMethodKey } from '../../../../shared/lib/passkey';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getPasskeyDerivationMethod } from '../../../selectors';

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
  const { trackEvent } = useContext(MetaMetricsContext);
  const passkeyDerivationMethod = useSelector(getPasskeyDerivationMethod);

  const handleClick = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyUnlockInteracted,
      properties: {
        status: 'passkey_icon_clicked',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        derivation_method: passkeyDerivationMethod,
      },
    });
    onClick();
  }, [onClick, passkeyDerivationMethod, trackEvent]);

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
      onClick={handleClick}
      type="button"
    />
  );
};
