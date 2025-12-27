import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { Box, Text } from '../../../../../../../components/component-library';
import { Skeleton } from '../../../../../../../components/component-library/skeleton';
import Tooltip from '../../../../../../../components/ui/tooltip';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getPreferences } from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';
import { useDappSwapContext } from '../../../../../context/dapp-swap';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { useBalanceChanges } from '../../../../simulation-details/useBalanceChanges';
import { useSelectedGasFeeToken } from '../../hooks/useGasFeeToken';
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';
import { SelectedGasFeeToken } from '../selected-gas-fee-token';

export const EditGasFeesRow = ({
  fiatFee,
  fiatFeeWith18SignificantDigits,
  nativeFee,
}: {
  fiatFee: string;
  fiatFeeWith18SignificantDigits: string | null;
  nativeFee: string;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { isQuotedSwapDisplayedInInfo } = useDappSwapContext();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );
  const {
    chainId,
    isGasFeeSponsored: doesSentinelAllowSponsorship,
    simulationData,
  } = transactionMeta;
  const gasFeeToken = useSelectedGasFeeToken();
  const showFiat = useShowFiat(chainId);
  const fiatValue = gasFeeToken ? gasFeeToken.amountFiat : fiatFee;
  const tokenValue = gasFeeToken ? gasFeeToken.amountFormatted : nativeFee;
  const metamaskFeeFiat = gasFeeToken?.metamaskFeeFiat;

  const tooltip =
    gasFeeToken?.metaMaskFee && gasFeeToken.metaMaskFee !== '0x0'
      ? t('confirmGasFeeTokenTooltip', [metamaskFeeFiat])
      : t('estimatedFeeTooltip');

  const balanceChangesResult = useBalanceChanges({ chainId, simulationData });
  const isLoadingGasUsed = !simulationData || balanceChangesResult.pending;

  // This prevents the gas fee row from showing as sponsored if stx is disabled
  // by the user and 7702 is not supported in the chain.
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const isGasFeeSponsored = isGaslessSupported && doesSentinelAllowSponsorship;

  const isGasFeeEditable =
    !isQuotedSwapDisplayedInInfo && !gasFeeToken && !isGasFeeSponsored;

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.EstimatedFee}
        ownerId={transactionMeta.id}
        data-testid="edit-gas-fees-row"
        label={t('networkFee')}
        tooltip={tooltip}
        style={{ alignItems: AlignItems.center }}
      >
        {isLoadingGasUsed ? (
          <Skeleton height={16} width={128} />
        ) : (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            textAlign={TextAlign.Center}
            gap={1}
          >
            {isGasFeeSponsored && (
              <Text
                color={TextColor.textDefault}
                data-testid="paid-by-meta-mask"
              >
                {t('paidByMetaMask')}
              </Text>
            )}
            {isGasFeeEditable && <EditGasIconButton />}
            {showFiat && !showAdvancedDetails && !isGasFeeSponsored && (
              <FiatValue
                fullValue={fiatFeeWith18SignificantDigits}
                roundedValue={fiatValue}
              />
            )}
            {!(showFiat && !showAdvancedDetails) && !isGasFeeSponsored && (
              <TokenValue roundedValue={tokenValue} />
            )}
            {!isGasFeeSponsored && <SelectedGasFeeToken />}
          </Box>
        )}
      </ConfirmInfoAlertRow>
      {!isGasFeeSponsored && (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          paddingInline={2}
        >
          <Box style={{ marginTop: gasFeeToken ? -8 : 0 }}>
            <Text
              data-testid="gas-fee-token-fee"
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              paddingBottom={gasFeeToken ? 2 : 0}
            >
              {gasFeeToken?.metaMaskFee && gasFeeToken?.metaMaskFee !== '0x0'
                ? t('confirmGasFeeTokenMetaMaskFee', [metamaskFeeFiat])
                : ' '}
            </Text>
          </Box>
          {showAdvancedDetails && (
            <FiatValue
              fullValue={fiatFeeWith18SignificantDigits}
              roundedValue={fiatValue}
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function TokenValue({ roundedValue }: { roundedValue: string }) {
  return (
    <Text color={TextColor.textDefault} data-testid="first-gas-field">
      {roundedValue}
    </Text>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function FiatValue({
  color,
  fullValue,
  roundedValue,
  variant,
}: {
  color?: TextColor;
  fullValue: string | null;
  roundedValue: string;
  variant?: TextVariant;
}) {
  const styleProps = { color, variant };
  const value = (
    <Text {...styleProps} data-testid="native-currency">
      {roundedValue}
    </Text>
  );

  return fullValue ? (
    <Tooltip title={fullValue}>{value}</Tooltip>
  ) : (
    <>{value}</>
  );
}

function useShowFiat(chainId: Hex): boolean {
  type TestNetChainId = (typeof TEST_CHAINS)[number];

  const isTestnet = TEST_CHAINS.includes(chainId as TestNetChainId);
  const { showFiatInTestnets } = useSelector(getPreferences);

  return !isTestnet || showFiatInTestnets;
}
