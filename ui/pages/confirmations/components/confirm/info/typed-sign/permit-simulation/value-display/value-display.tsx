import React, { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import { captureException } from '@sentry/browser';

import { MetaMetricsEventLocation } from '../../../../../../../../../shared/constants/metametrics';
import { shortenString } from '../../../../../../../../helpers/utils/util';
import { calcTokenAmount } from '../../../../../../../../../shared/lib/transactions-controller-utils';
import useTokenExchangeRate from '../../../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { IndividualFiatDisplay } from '../../../../../simulation-details/fiat-display';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../../simulation-details/formatAmount';
import useGetTokenStandardAndDetails from '../../../../../../hooks/useGetTokenStandardAndDetails';
import useTrackERC20WithoutDecimalInformation from '../../../../../../hooks/useTrackERC20WithoutDecimalInformation';

import {
  Box,
  Text,
} from '../../../../../../../../components/component-library';
import Tooltip from '../../../../../../../../components/ui/tooltip';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  JustifyContent,
  TextAlign,
} from '../../../../../../../../helpers/constants/design-system';
import Name from '../../../../../../../../components/app/name/name';
import { TokenDetailsERC20 } from '../../../../../../utils/token';

type PermitSimulationValueDisplayParams = {
  /** The primaryType of the typed sign message */
  primaryType?: string;

  /**
   * The ethereum token contract address. It is expected to be in hex format.
   * We currently accept strings since we have a patch that accepts a custom string
   * {@see .yarn/patches/@metamask-eth-json-rpc-middleware-npm-14.0.1-b6c2ccbe8c.patch}
   */
  tokenContract: Hex | string;

  /** The token amount */
  value: number | string;
};

const PermitSimulationValueDisplay: React.FC<
  PermitSimulationValueDisplayParams
> = ({ primaryType, tokenContract, value }) => {
  const exchangeRate = useTokenExchangeRate(tokenContract);

  const tokenDetails = useGetTokenStandardAndDetails(tokenContract);
  useTrackERC20WithoutDecimalInformation(
    tokenContract,
    tokenDetails as TokenDetailsERC20,
    MetaMetricsEventLocation.SignatureConfirmation,
  );
  const { decimalsNumber: tokenDecimals } = tokenDetails;

  const fiatValue = useMemo(() => {
    if (exchangeRate && value) {
      const tokenAmount = calcTokenAmount(value, tokenDecimals);
      return exchangeRate.times(tokenAmount).toNumber();
    }
    return undefined;
  }, [exchangeRate, tokenDecimals, value]);

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

  /** Temporary error capturing as we are building out Permit Simulations */
  if (!tokenContract) {
    captureException(
      new Error(
        `PermitSimulationValueDisplay: Token contract address is missing where primaryType === ${primaryType}`,
      ),
    );
    return null;
  }

  return (
    <Box>
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
        <Name value={tokenContract} type={NameType.ETHEREUM_ADDRESS} />
      </Box>
      <Box>
        {fiatValue && <IndividualFiatDisplay fiatAmount={fiatValue} shorten />}
      </Box>
    </Box>
  );
};

export default PermitSimulationValueDisplay;
