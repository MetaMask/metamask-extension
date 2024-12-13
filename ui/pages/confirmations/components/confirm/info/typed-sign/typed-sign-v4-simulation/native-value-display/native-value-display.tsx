import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TokenStandard } from '../../../../../../../../../shared/constants/transaction';
import { calcTokenAmount } from '../../../../../../../../../shared/lib/transactions-controller-utils';
import {
  Box,
  Text,
} from '../../../../../../../../components/component-library';
import Tooltip from '../../../../../../../../components/ui/tooltip';
import {
  BlockSize,
  BorderRadius,
  Display,
  JustifyContent,
  TextAlign,
} from '../../../../../../../../helpers/constants/design-system';
import { shortenString } from '../../../../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../../../../hooks/useI18nContext';
import { selectConversionRateByChainId } from '../../../../../../../../selectors';
import { AssetPill } from '../../../../../simulation-details/asset-pill';
import { IndividualFiatDisplay } from '../../../../../simulation-details/fiat-display';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../../simulation-details/formatAmount';
import { UNLIMITED_THRESHOLD } from '../../../approve/hooks/use-approve-token-simulation';
import { getAmountColors } from '../../../utils';

const NATIVE_DECIMALS = 18;

type PermitSimulationValueDisplayParams = {
  /** ID of the associated chain. */
  chainId: Hex;

  /** The token amount */
  value: number | string;

  /** True if value is being credited to wallet */
  credit?: boolean;

  /** True if value is being debited to wallet */
  debit?: boolean;
};

const NativeValueDisplay: React.FC<PermitSimulationValueDisplayParams> = ({
  chainId,
  value,
  credit,
  debit,
}) => {
  const t = useI18nContext();

  const conversionRate = useSelector((state) =>
    selectConversionRateByChainId(state, chainId),
  );

  const {
    fiatValue,
    tokenValue,
    tokenValueMaxPrecision,
    shouldShowUnlimitedValue,
  } = useMemo(() => {
    if (!value) {
      return {
        tokenValue: null,
        tokenValueMaxPrecision: null,
        shouldShowUnlimitedValue: false,
      };
    }

    const tokenAmount = calcTokenAmount(value, NATIVE_DECIMALS);

    return {
      fiatValue: conversionRate
        ? new BigNumber(tokenAmount).times(String(conversionRate)).toNumber()
        : undefined,
      tokenValue: formatAmount('en-US', tokenAmount),
      tokenValueMaxPrecision: formatAmountMaxPrecision('en-US', tokenAmount),
      shouldShowUnlimitedValue: Number(value) > UNLIMITED_THRESHOLD,
    };
  }, [conversionRate, value]);

  const { color, backgroundColor } = getAmountColors(credit, debit);

  return (
    <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
      <Box display={Display.Flex} justifyContent={JustifyContent.flexEnd}>
        <Box
          display={Display.Inline}
          marginInlineEnd={1}
          minWidth={BlockSize.Zero}
        >
          <Tooltip
            position="bottom"
            title={tokenValueMaxPrecision}
            wrapperStyle={{ minWidth: 0 }}
            interactive
          >
            <Text
              data-testid="simulation-native-value-display"
              backgroundColor={backgroundColor}
              borderRadius={BorderRadius.XL}
              color={color}
              paddingInline={2}
              style={{ paddingTop: '1px', paddingBottom: '1px' }}
              textAlign={TextAlign.Center}
            >
              {credit && '+ '}
              {debit && '- '}
              {shouldShowUnlimitedValue
                ? t('unlimited')
                : tokenValue !== null &&
                  shortenString(tokenValue || '', {
                    truncatedCharLimit: 15,
                    truncatedStartChars: 15,
                    truncatedEndChars: 0,
                    skipCharacterInEnd: true,
                  })}
            </Text>
          </Tooltip>
        </Box>
        <AssetPill asset={{ chainId, standard: TokenStandard.none }} />
      </Box>
      <Box>
        {fiatValue !== undefined && (
          <IndividualFiatDisplay fiatAmount={fiatValue} shorten />
        )}
      </Box>
    </Box>
  );
};

export default NativeValueDisplay;
