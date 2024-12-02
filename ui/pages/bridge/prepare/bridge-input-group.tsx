import React from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { SwapsTokenObject } from '../../../../shared/constants/swaps';
import {
  Box,
  Text,
  TextField,
  TextFieldType,
} from '../../../components/component-library';
import { AssetPicker } from '../../../components/multichain/asset-picker-amount/asset-picker';
import { TabName } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import CurrencyDisplay from '../../../components/ui/currency-display';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount';
import { isSwapsDefaultTokenSymbol } from '../../../../shared/modules/swaps.utils';
import Tooltip from '../../../components/ui/tooltip';
import { SwapsEthToken } from '../../../selectors';
import {
  ERC20Asset,
  NativeAsset,
} from '../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { zeroAddress } from '../../../__mocks__/ethereumjs-util';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../../shared/constants/network';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';

const generateAssetFromToken = (
  chainId: Hex,
  tokenDetails: SwapsTokenObject | SwapsEthToken,
): ERC20Asset | NativeAsset => {
  if ('iconUrl' in tokenDetails && tokenDetails.address !== zeroAddress()) {
    return {
      type: AssetType.token,
      image: tokenDetails.iconUrl,
      symbol: tokenDetails.symbol,
      address: tokenDetails.address,
    };
  }

  return {
    type: AssetType.native,
    image:
      CHAIN_ID_TOKEN_IMAGE_MAP[
        chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
      ],
    symbol:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
  };
};

export const BridgeInputGroup = ({
  className,
  header,
  token,
  onAssetChange,
  onAmountChange,
  networkProps,
  customTokenListGenerator,
  amountFieldProps = {},
}: {
  className: string;
  onAmountChange?: (value: string) => void;
  token: SwapsTokenObject | SwapsEthToken | null;
  amountFieldProps?: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled' | 'className'
  >;
} & Pick<
  React.ComponentProps<typeof AssetPicker>,
  'networkProps' | 'header' | 'customTokenListGenerator' | 'onAssetChange'
>) => {
  const t = useI18nContext();

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const tokenFiatValue = useTokenFiatAmount(
    token?.address || undefined,
    amountFieldProps?.value?.toString() || '0x0',
    token?.symbol,
    {
      showFiat: true,
    },
    true,
  );
  const ethFiatValue = useEthFiatAmount(
    amountFieldProps?.value?.toString() || '0x0',
    { showFiat: true },
    true,
  );

  const { formattedBalance } = useLatestBalance(
    token,
    networkProps?.network?.chainId,
  );

  return (
    <Box className={className}>
      <Box className="prepare-bridge-page__input-row">
        <AssetPicker
          header={header}
          visibleTabs={[TabName.TOKENS]}
          asset={
            networkProps?.network?.chainId && token
              ? generateAssetFromToken(networkProps.network.chainId, token)
              : undefined
          }
          onAssetChange={onAssetChange}
          networkProps={networkProps}
          customTokenListGenerator={customTokenListGenerator}
        />
        <Tooltip
          containerClassName="amount-tooltip"
          position="top"
          title={amountFieldProps.value}
          disabled={(amountFieldProps.value?.toString()?.length ?? 0) < 12}
          arrow
          hideOnClick={false}
          // explicitly inherit display since Tooltip will default to block
          style={{ display: 'inherit' }}
        >
          <TextField
            type={TextFieldType.Number}
            className="amount-input"
            placeholder={
              isLoading && !activeQuote ? t('bridgeCalculatingAmount') : '0'
            }
            onChange={(e) => {
              onAmountChange?.(e.target.value);
            }}
            {...amountFieldProps}
          />
        </Tooltip>
      </Box>
      <Box className="prepare-bridge-page__amounts-row">
        <Text>
          {formattedBalance ? `${t('balance')}: ${formattedBalance}` : ' '}
        </Text>
        <CurrencyDisplay
          currency="usd"
          displayValue={
            token?.symbol &&
            networkProps?.network?.chainId &&
            isSwapsDefaultTokenSymbol(
              token.symbol,
              networkProps.network.chainId,
            )
              ? ethFiatValue
              : tokenFiatValue
          }
          hideLabel
        />
      </Box>
    </Box>
  );
};
