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

const AddRewardsAccount: React.FC<AddRewardsAccountProps> = ({ account }) => {
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
      onClick={handleClick}
      textProps={{ variant: TextVariant.BodySm }}
      data-testid="add-rewards-account-button"
      startAccessory={
        isLoading ? (
          <Icon name={IconName.Loading} size={IconSize.Sm} />
        ) : (
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
      disabled={isLoading}
    >
      {isError ? t('rewardsLinkAccountError') : t('rewardsLinkAccount')}
    </TextButton>
  );
};

export default AddRewardsAccount;
