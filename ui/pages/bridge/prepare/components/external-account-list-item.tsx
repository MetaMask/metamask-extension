import React from 'react';
import classnames from 'classnames';
import { ExternalAccount } from '../types';
import { shortenAddress } from '../../../../helpers/utils/util';
import { Box, Text, Tag } from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';
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
  const t = useI18nContext();
  const isEnsName = account.metadata.name.endsWith('.eth');

  return (
    <Box
      display={Display.Flex}
      padding={4}
      backgroundColor={BackgroundColor.transparent}
      className={classnames('multichain-account-list-item gap-2', {
        'multichain-account-list-item--selected': selected,
      })}
      onClick={onClick}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        <PreferredAvatar address={account.address} />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          style={{ maxWidth: '140px', overflow: 'hidden' }}
        >
          <Text
            variant={TextVariant.bodyMdMedium}
            marginBottom={1}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isEnsName ? account.metadata.name : t('externalAccount')}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            data-testid="account-list-address"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shortenAddress(normalizeSafeAddress(account.address))}
          </Text>
        </Box>
      </Box>

      {isEnsName && (
        <Tag
          label={t('externalAccount')}
          paddingLeft={2}
          paddingRight={2}
          labelProps={{ variant: TextVariant.bodyXs }}
        />
      )}
    </Box>
  );
};
