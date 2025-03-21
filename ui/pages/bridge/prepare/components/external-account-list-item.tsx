import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { ExternalAccount } from '../types';
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
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type ExternalAccountListItemProps = {
  account: ExternalAccount;
  selected: boolean;
  onClick?: () => void;
};

export const ExternalAccountListItem: React.FC<
  ExternalAccountListItemProps
> = ({ account, selected, onClick }) => {
  const useBlockie = useSelector(getUseBlockie);
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={BackgroundColor.transparent}
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
