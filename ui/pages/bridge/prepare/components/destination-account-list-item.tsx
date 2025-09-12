import React from 'react';
import { useSelector } from 'react-redux';
import {
  formatChainIdToHex,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { isEvmAccountType } from '@metamask/keyring-api';
import { shortenAddress } from '../../../../helpers/utils/util';

import {
  Text,
  Tag,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
} from '../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

import {
  getShouldHideZeroBalanceTokens,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getChainIdsToPoll,
} from '../../../../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { useGetFormattedTokensPerChain } from '../../../../hooks/useGetFormattedTokensPerChain';
import { useAccountTotalCrossChainFiatBalance } from '../../../../hooks/useAccountTotalCrossChainFiatBalance';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY } from '../../../../helpers/constants/common';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';
import { Column, Row } from '../../layout';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { getToChain } from '../../../../ducks/bridge/selectors';
import { type DestinationAccount } from '../types';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';

const MAXIMUM_CURRENCY_DECIMALS = 3;

type DestinationAccountListItemProps = {
  account: DestinationAccount;
  selected?: boolean;
  onClick?: () => void;
  isExternal?: boolean;
};

const DestinationAccountListItem: React.FC<DestinationAccountListItemProps> = ({
  account,
  selected = false,
  onClick,
  isExternal = false,
}) => {
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const allChainIDs = useSelector(getChainIdsToPoll);

  const isEvmNetwork = isEvmAccountType(account.type);

  const toChain = useSelector(getToChain);
  const { balanceByChainId } = useMultichainBalances(
    'id' in account ? account.id : undefined,
  );

  const { formattedTokensWithBalancesPerChain } = useGetFormattedTokensPerChain(
    account,
    shouldHideZeroBalanceTokens,
    isTokenNetworkFilterEqualCurrentNetwork,
    allChainIDs,
  );

  const { totalFiatBalance } = useAccountTotalCrossChainFiatBalance(
    account,
    formattedTokensWithBalancesPerChain,
  );

  let balanceToTranslate;
  if (isEvmNetwork) {
    balanceToTranslate = totalFiatBalance;
  } else {
    const chainIdInHexOrCaip =
      toChain?.chainId &&
      (isSolanaChainId(toChain?.chainId)
        ? toChain.chainId
        : formatChainIdToHex(toChain?.chainId));
    balanceToTranslate = chainIdInHexOrCaip
      ? balanceByChainId[chainIdInHexOrCaip]?.toString()
      : '0';
  }

  const t = useI18nContext();

  return (
    <Row
      gap={4}
      padding={2}
      paddingInline={4}
      onClick={onClick}
      className={
        selected
          ? 'multichain-account-list-item--selected'
          : 'multichain-account-list-item'
      }
    >
      <Box
        style={{
          borderRadius: 12,
          // eslint-disable-next-line @metamask/design-tokens/color-no-hex
          borderColor: '#8b99ff',
          borderWidth: selected ? 2 : 0,
          padding: selected ? 1 : 3,
          height: 38,
        }}
      >
        <PreferredAvatar
          style={{
            minWidth: 'max-content',
            borderRadius: 8,
          }}
          address={account.address}
        />
      </Box>
      <Column
        gap={1}
        data-testid={selected ? 'selected-to-account' : undefined}
      >
        <Row gap={1} style={{ maxWidth: 'min-content' }}>
          <Text variant={TextVariant.bodyMdMedium} ellipsis>
            {account.displayName}
          </Text>
          {selected && (
            <Icon
              name={IconName.CheckBold}
              size={IconSize.Md}
              color={IconColor.PrimaryDefault}
            />
          )}
        </Row>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternativeSoft}
          data-testid="account-list-address"
        >
          {shortenAddress(normalizeSafeAddress(account.address))}
        </Text>
      </Column>
      {isExternal ? (
        <Tag
          label={t('externalAccount')}
          labelProps={{ variant: TextVariant.bodyXs }}
          style={{ whiteSpace: 'nowrap' }}
        />
      ) : (
        <Column alignItems={AlignItems.flexEnd} width={BlockSize.Max} gap={1}>
          <UserPreferencedCurrencyDisplay
            ethNumberOfDecimals={MAXIMUM_CURRENCY_DECIMALS}
            value={balanceToTranslate}
            type={PRIMARY}
            showFiat={true}
            isAggregatedFiatOverviewBalance={true}
            hideLabel={true}
            data-testid="first-currency-display"
          />
          <AvatarNetwork
            src={
              CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                toChain?.chainId && !isSolanaChainId(toChain?.chainId)
                  ? formatChainIdToHex(toChain?.chainId)
                  : (toChain?.chainId ?? '')
              ]
            }
            name={toChain?.name ?? ''}
            size={AvatarNetworkSize.Xs}
          />
        </Column>
      )}
    </Row>
  );
};

export default React.memo(DestinationAccountListItem);
