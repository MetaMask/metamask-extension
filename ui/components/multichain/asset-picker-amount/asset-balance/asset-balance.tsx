import React from 'react';
import { Box, Text } from '../../../component-library';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Asset } from '../../../../ducks/send';
import { AssetBalanceText } from './asset-balance-text';

type AssetBalanceProps = {
  error?: string;
  asset: Asset;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AssetBalance({ asset, error }: AssetBalanceProps) {
  const t = useI18nContext();

  const balanceColor = error
    ? TextColor.errorDefault
    : TextColor.textAlternative;

  return (
    <Box className="asset-picker-amount__balance" display={Display.Flex}>
      <Text color={balanceColor} marginRight={1} variant={TextVariant.bodySm}>
        {t('balance')}:
      </Text>

      <AssetBalanceText
        asset={asset}
        balanceColor={balanceColor}
        error={error}
      />
    </Box>
  );
}
