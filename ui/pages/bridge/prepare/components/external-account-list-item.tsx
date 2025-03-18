import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { ExternalAccount } from '../../../../../shared/types/bridge';
import { shortenAddress } from '../../../../helpers/utils/util';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Display,
  TextColor,
  TextVariant,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../../selectors';
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { t } from '../../../../../app/scripts/translate';

type ExternalAccountListItemProps = {
  account: ExternalAccount;
  selected: boolean;
  onClick?: () => void;
};

export const ExternalAccountListItem: React.FC<
  ExternalAccountListItemProps
> = ({ account, selected, onClick }) => {
  const useBlockie = useSelector(getUseBlockie);

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      className={classnames('multichain-account-list-item', {
        'multichain-account-list-item--selected': selected,
      })}
      onClick={onClick}
      alignItems={AlignItems.center}
    >
      <AvatarAccount
        borderColor={BorderColor.transparent}
        size={AvatarAccountSize.Md}
        address={account.address}
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        marginInlineEnd={2}
      />

      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Text variant={TextVariant.bodyMdMedium} marginBottom={1}>
          {t('externalAccount')}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          data-testid="account-list-address"
        >
          {shortenAddress(normalizeSafeAddress(account.address))}
        </Text>
      </Box>
    </Box>
  );
};
