import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import { captureException } from '@sentry/browser';
import React, { useMemo } from 'react';
import { MetaMetricsEventLocation } from '../../../../../../../../../shared/constants/metametrics';
import { calcTokenAmount } from '../../../../../../../../../shared/lib/transactions-controller-utils';
import useTokenExchangeRate from '../../../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import Name from '../../../../../../../../components/app/name/name';
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
import { useGetTokenStandardAndDetails } from '../../../../../../hooks/useGetTokenStandardAndDetails';
import useTrackERC20WithoutDecimalInformation from '../../../../../../hooks/useTrackERC20WithoutDecimalInformation';
import { TokenDetailsERC20 } from '../../../../../../utils/token';
import { IndividualFiatDisplay } from '../../../../../simulation-details/fiat-display';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../../simulation-details/formatAmount';
import {
  DAI_CONTRACT_ADDRESS,
  TOKEN_VALUE_UNLIMITED_THRESHOLD,
} from '../../../shared/constants';
import { getAmountColors } from '../../../utils';

type PermitSimulationValueDisplayParams = {
  /** ID of the associated chain. */
  chainId: Hex;

  /** The primaryType of the typed sign message */
  primaryType?: string;

  /**
   * The ethereum token contract address. It is expected to be in hex format.
   * We currently accept strings since we have a patch that accepts a custom string
   * {@see .yarn/patches/@metamask-eth-json-rpc-middleware-npm-14.0.1-b6c2ccbe8c.patch}
   */
  tokenContract: Hex | string;

  /** The token amount */
  value?: number | string;

  /** The tokenId for NFT */
  tokenId?: string;

  /** The permit message */
  message?: { allowed?: boolean | null };

  /** True if value is being credited to wallet */
  credit?: boolean;

  /** True if value is being debited to wallet */
  debit?: boolean;

  /** Whether a large amount can be substituted by "Unlimited" */
  canDisplayValueAsUnlimited?: boolean;
};

const PermitSimulationValueDisplay: React.FC<
  PermitSimulationValueDisplayParams
> = ({
  chainId,
  primaryType,
  tokenContract,
  tokenId,
  value,
  message,
  credit,
  debit,
  canDisplayValueAsUnlimited,
}) => {
  const t = useI18nContext();

  const exchangeRate = useTokenExchangeRate(tokenContract);

  const tokenDetails = useGetTokenStandardAndDetails(tokenContract);
  useTrackERC20WithoutDecimalInformation(
    chainId,
    tokenContract,
    tokenDetails as TokenDetailsERC20,
    MetaMetricsEventLocation.SignatureConfirmation,
  );
  const { decimalsNumber: tokenDecimals } = tokenDetails;

  const fiatValue = useMemo(() => {
    if (exchangeRate && value && !tokenId) {
      const tokenAmount = calcTokenAmount(value, tokenDecimals);
      return exchangeRate.times(tokenAmount).toNumber();
    }
    return undefined;
  }, [exchangeRate, tokenDecimals, tokenId, value]);

  const { tokenValue, tokenValueMaxPrecision, shouldShowUnlimitedValue } =
    useMemo(() => {
      const isDAIPermit = tokenContract === DAI_CONTRACT_ADDRESS;
      const hasPermitAllowedProp = message?.allowed !== undefined;
      const showUnlimitedDueToDAIContract = isDAIPermit && hasPermitAllowedProp;

      if (!value || tokenId) {
        return {
          tokenValue: null,
          tokenValueMaxPrecision: null,
          shouldShowUnlimitedValue:
            canDisplayValueAsUnlimited && showUnlimitedDueToDAIContract,
        };
      }

      const tokenAmount = calcTokenAmount(value, tokenDecimals);

      const showUnlimitedDueToPermitValue =
        Number(value) > TOKEN_VALUE_UNLIMITED_THRESHOLD;

      return {
        tokenValue: formatAmount('en-US', tokenAmount),
        tokenValueMaxPrecision: formatAmountMaxPrecision('en-US', tokenAmount),
        shouldShowUnlimitedValue:
          canDisplayValueAsUnlimited &&
          (showUnlimitedDueToPermitValue || showUnlimitedDueToDAIContract),
      };
    }, [tokenDecimals, tokenId, value]);

  /** Temporary error capturing as we are building out Permit Simulations */
  if (!tokenContract) {
    captureException(
      new Error(
        `PermitSimulationValueDisplay: Token contract address is missing where primaryType === ${primaryType}`,
      ),
    );
    return null;
  }

  const { color, backgroundColor } = getAmountColors(credit, debit);

  return (
    <Box marginLeft="auto" style={{ maxWidth: '100%' }}>
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
              {tokenId && `#${tokenId}`}
            </Text>
          </Tooltip>
        </Box>
        <Name
          value={tokenContract}
          type={NameType.ETHEREUM_ADDRESS}
          variation={chainId}
          preferContractSymbol
        />
      </Box>
      <Box>
        {fiatValue !== undefined && (
          <IndividualFiatDisplay fiatAmount={fiatValue} shorten />
        )}
      </Box>
    </Box>
  );
};

export default PermitSimulationValueDisplay;
