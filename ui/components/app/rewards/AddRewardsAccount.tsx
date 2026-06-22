import React, { useCallback } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconSize,
  IconName,
  Icon,
  IconColor,
} from '@metamask/design-system-react';
import { useLinkAccountAddress } from '../../../hooks/rewards/useLinkAccountAddress';
import { useI18nContext } from '../../../hooks/useI18nContext';

type AddRewardsAccountProps = {
  account: InternalAccount;
};

const AddRewardsAccount = ({ account }: AddRewardsAccountProps) => {
  const t = useI18nContext();
  const { linkAccountAddress, isLoading, isError } = useLinkAccountAddress();

  const handleClick = useCallback(async () => {
    if (!account) {
      return;
    }

    await linkAccountAddress(account);
  }, [account, linkAccountAddress]);

  if (!account) {
    return null;
  }

  return (
    <Button
      variant={ButtonVariant.Tertiary}
      size={ButtonSize.Sm}
      onClick={handleClick}
      data-testid="add-rewards-account-button"
      isLoading={isLoading}
      isDisabled={isLoading}
      loadingText={t('rewardsLinkAccountLoading')}
      startAccessory={
        isLoading ? undefined : (
          <img
            src={'./images/metamask-rewards-points-alternative.svg'}
            alt={t('rewardsPointsIcon')}
            width={16}
            height={16}
          />
        )
      }
      endAccessory={
        isError ? (
          <Icon
            name={IconName.Refresh}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        ) : undefined
      }
    >
      {isError ? t('rewardsLinkAccountError') : t('rewardsLinkAccount')}
    </Button>
  );
};

export default AddRewardsAccount;
