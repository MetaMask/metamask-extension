import { NameType } from '@metamask/name-controller';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import { parseTypedDataMessage } from '../../../../../../../../shared/modules/transaction.utils';
import useTokenExchangeRate from '../../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import Name from '../../../../../../../components/app/name/name';
import { Box, Text } from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  TextAlign,
} from '../../../../../../../helpers/constants/design-system';
import { shortenString } from '../../../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import { SignatureRequestType } from '../../../../../types/confirm';
import { IndividualFiatDisplay } from '../../../../simulation-details/fiat-display';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../simulation-details/formatAmount';
import StaticSimulation from '../../shared/static-simulation/static-simulation';

const PermitSimulation: React.FC<{
  tokenDecimals: number;
}> = ({ tokenDecimals }) => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  const {
    domain: { verifyingContract },
    message: { value },
  } = parseTypedDataMessage(currentConfirmation.msgParams?.data as string);

  const exchangeRate = useTokenExchangeRate(verifyingContract);

  const fiatValue = useMemo(() => {
    if (exchangeRate && value) {
      const tokenAmount = calcTokenAmount(value, tokenDecimals);
      return exchangeRate.times(tokenAmount).toNumber();
    }
    return undefined;
  }, [exchangeRate, value]);

  const { tokenValue, tokenValueMaxPrecision } = useMemo(() => {
    if (!value) {
      return { tokenValue: null, tokenValueMaxPrecision: null };
    }
    const tokenAmount = calcTokenAmount(value, tokenDecimals);

    return {
      tokenValue: formatAmount('en-US', tokenAmount),
      tokenValueMaxPrecision: formatAmountMaxPrecision('en-US', tokenAmount),
    };
  }, [tokenDecimals, value]);

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t('permitSimulationDetailInfo')}
      simulationHeading={t('spendingCap')}
      simulationElements={
        <>
          <Box display={Display.Flex}>
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
                  data-testid="simulation-token-value"
                  backgroundColor={BackgroundColor.backgroundAlternative}
                  borderRadius={BorderRadius.XL}
                  paddingInline={2}
                  style={{ paddingTop: '1px', paddingBottom: '1px' }}
                  textAlign={TextAlign.Center}
                >
                  {shortenString(tokenValue || '', {
                    truncatedCharLimit: 15,
                    truncatedStartChars: 15,
                    truncatedEndChars: 0,
                    skipCharacterInEnd: true,
                  })}
                </Text>
              </Tooltip>
            </Box>
            <Name value={verifyingContract} type={NameType.ETHEREUM_ADDRESS} />
          </Box>
          <Box>
            {fiatValue && (
              <IndividualFiatDisplay fiatAmount={fiatValue} shorten />
            )}
          </Box>
        </>
      }
    />
  );
};

export default PermitSimulation;
