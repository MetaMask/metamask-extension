import React from 'react';
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
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount';
import { isSwapsDefaultTokenSymbol } from '../../../../shared/modules/swaps.utils';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import Tooltip from '../../../components/ui/tooltip';

export const BridgeInputGroup = ({
  className,
  header,
  asset,
  onAssetChange,
  onAmountChange,
  networkProps,
  customTokenListGenerator,
  amountFieldProps = {},
}: {
  className: string;
  asset?: AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>;
  onAmountChange?: (value: string) => void;
  amountFieldProps?: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled'
  >;
} & Pick<
  React.ComponentProps<typeof AssetPicker>,
  | 'networkProps'
  | 'header'
  | 'customTokenListGenerator'
  | 'onAssetChange'
  | 'asset'
>) => {
  const t = useI18nContext();

  const tokenFiatValue = useTokenFiatAmount(
    asset?.address || undefined,
    amountFieldProps?.value?.toString() || '0x0',
    asset?.symbol,
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

  return (
    <Box className={className}>
      <Box className="prepare-bridge-page__input-row">
        <AssetPicker
          header={header}
          visibleTabs={[TabName.TOKENS]}
          asset={asset}
          onAssetChange={onAssetChange}
          networkProps={networkProps}
          customTokenListGenerator={customTokenListGenerator}
        />
        <Tooltip
          containerClassName="amount-tooltip"
          position="top"
          title={amountFieldProps.value}
          disabled={amountFieldProps.value?.toString()?.length ?? 0 < 12}
          arrow
          hideOnClick={false}
          // explicitly inherit display since Tooltip will default to block
          style={{ display: 'inherit' }}
        >
          <TextField
            type={TextFieldType.Number}
            className="amount-input"
            placeholder="0"
            onChange={(e) => {
              // TODO validate input

              onAmountChange?.(e.target.value);
            }}
            {...amountFieldProps}
          />
        </Tooltip>
      </Box>
      <Box className="prepare-bridge-page__amounts-row">
        <Text>
          {t('balance')}: {asset?.string || '0'}
        </Text>
        <CurrencyDisplay
          currency="usd"
          displayValue={
            asset?.symbol &&
            networkProps?.network?.chainId &&
            isSwapsDefaultTokenSymbol(
              asset.symbol,
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
