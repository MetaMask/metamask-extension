import React, { useCallback } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  IconSize,
  IconName,
  TextButton,
  TextVariant,
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
    <TextButton
      onClick={isLoading ? undefined : handleClick}
      variant={TextVariant.BodySm}
      data-testid="add-rewards-account-button"
      aria-disabled={isLoading}
      className="flex gap-1 items-center"
    >
      {isLoading ? (
        <Icon name={IconName.Loading} size={IconSize.Sm} className="animate-spin" />
      ) : (
        <img
          src={'./images/metamask-rewards-points-alternative.svg'}
          alt={t('rewardsPointsIcon')}
          width={16}
          height={16}
        />
      )}
      {isError ? t('rewardsLinkAccountError') : t('rewardsLinkAccount')}
      {isError && (
        <Icon
          name={IconName.Refresh}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
        />
      )}
    </TextButton>
  );
};

export default AddRewardsAccount;
