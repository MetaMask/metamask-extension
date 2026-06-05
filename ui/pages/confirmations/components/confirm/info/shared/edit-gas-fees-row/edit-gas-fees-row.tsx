import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../../../components/component-library';
import { Skeleton } from '../../../../../../../components/component-library/skeleton';
import Tooltip from '../../../../../../../components/ui/tooltip';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getPreferences } from '../../../../../../../../shared/lib/selectors/preferences';
import { useConfirmContext } from '../../../../../context/confirm';
import { useDappSwapContext } from '../../../../../context/dapp-swap';
import { useEstimationFailed } from '../../../../../hooks/gas/useEstimationFailed';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useGasSponsorshipPreference } from '../../../../../hooks/gas/useGasSponsorshipPreference';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { useBalanceChanges } from '../../../../simulation-details/useBalanceChanges';
import { useTransactionNativeTicker } from '../../../../../hooks/transactions/useTransactionNativeTicker';
import { useSelectedGasFeeToken } from '../../hooks/useGasFeeToken';
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';
import { SelectedGasFeeToken } from '../selected-gas-fee-token';
import { GasSponsorshipModal } from '../gas-sponsorship-modal';

export const EditGasFeesRow = ({
  fiatFee,
  fiatFeeWith18SignificantDigits,
  nativeFee,
  disableUpdate,
}: {
  fiatFee: string;
  fiatFeeWith18SignificantDigits: string | null;
  nativeFee: string;
  disableUpdate?: boolean;
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
    type: transactionType,
  } = transactionMeta;

  const estimationFailed = useEstimationFailed();
  const gasFeeToken = useSelectedGasFeeToken();
  const showFiat = useShowFiat(chainId);
  const fiatValue = gasFeeToken?.amountFiat || fiatFee;
  const hasFiatValue = Boolean(fiatValue);
  const tokenValue = gasFeeToken ? gasFeeToken.amountFormatted : nativeFee;
  const metamaskFeeFiat = gasFeeToken?.metamaskFeeFiat;
  const nativeTokenSymbol = useTransactionNativeTicker() ?? '';

  const balanceChangesResult = useBalanceChanges({ chainId, simulationData });
  const isLoadingGasUsed = !simulationData || balanceChangesResult.pending;

  // This prevents the gas fee row from showing as sponsored if stx is disabled
  // by the user and 7702 is not supported in the chain.
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { isOptedOut: isSponsorshipOptedOut } =
    useGasSponsorshipPreference(chainId);

  const isSponsorshipEligible =
    isGaslessSupported &&
    doesSentinelAllowSponsorship &&
    transactionType !== TransactionType.revokeDelegation;

  const isGasFeeSponsored = isSponsorshipEligible && !isSponsorshipOptedOut;

  const [isSponsorshipModalOpen, setIsSponsorshipModalOpen] = useState(false);
  const handleOpenSponsorshipModal = useCallback(() => {
    setIsSponsorshipModalOpen(true);
  }, []);
  const handleCloseSponsorshipModal = useCallback(() => {
    setIsSponsorshipModalOpen(false);
  }, []);

  let tooltip = t('estimatedFeeTooltip');
  if (isGasFeeSponsored) {
    tooltip = t('gasSponsorshipOptOutTooltip');
  } else if (gasFeeToken?.metaMaskFee && gasFeeToken.metaMaskFee !== '0x0') {
    tooltip = t('confirmGasFeeTokenTooltip', [metamaskFeeFiat]);
  }

  const isGasFeeEditable =
    !disableUpdate &&
    !isQuotedSwapDisplayedInInfo &&
    !gasFeeToken &&
    !isGasFeeSponsored;
  const shouldShowPrimaryFiatValue =
    showFiat && hasFiatValue && !showAdvancedDetails && !isGasFeeSponsored;

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      {isSponsorshipModalOpen && (
        <GasSponsorshipModal onClose={handleCloseSponsorshipModal} />
      )}
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
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexEnd}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              textAlign={TextAlign.Center}
              gap={1}
              onClick={
                isSponsorshipEligible ? handleOpenSponsorshipModal : undefined
              }
              style={{
                cursor: isSponsorshipEligible ? 'pointer' : 'default',
              }}
            >
              {isGasFeeSponsored && <GasFeeSponsoredByMetaMask />}
              {isGasFeeEditable && <EditGasIconButton />}
              {estimationFailed && !isGasFeeSponsored && (
                <Text color={TextColor.textDefault}>{t('unavailable')}</Text>
              )}
              {!estimationFailed && (
                <>
                  {shouldShowPrimaryFiatValue && (
                    <FiatValue
                      fullValue={fiatFeeWith18SignificantDigits}
                      roundedValue={fiatValue}
                    />
                  )}
                  {!shouldShowPrimaryFiatValue && !isGasFeeSponsored && (
                    <TokenValue roundedValue={tokenValue} />
                  )}
                </>
              )}
              {!isGasFeeSponsored && <SelectedGasFeeToken />}
              {isSponsorshipEligible && (
                <Icon
                  name={IconName.ArrowRight}
                  size={IconSize.Xs}
                  color={IconColor.iconAlternative}
                  data-testid="gas-sponsorship-chevron"
                />
              )}
            </Box>
            {isGasFeeSponsored && (
              <Text
                variant={TextVariant.bodyXs}
                color={TextColor.textAlternative}
                data-testid="smart-account-activation-label"
              >
                {t('includesSmartAccountActivation')}
              </Text>
            )}
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
          {showAdvancedDetails && !estimationFailed && hasFiatValue && (
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function GasFeeSponsoredByMetaMask() {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      gap={1}
      data-testid="paid-by-meta-mask"
    >
      <Icon
        name={IconName.Check}
        size={IconSize.Sm}
        color={IconColor.successDefault}
      />
      <Text color={TextColor.successDefault}>{t('paidByMetaMask')}</Text>
    </Box>
  );
}

function useShowFiat(chainId: Hex): boolean {
  type TestNetChainId = (typeof TEST_CHAINS)[number];

  const isTestnet = TEST_CHAINS.includes(chainId as TestNetChainId);
  const { showFiatInTestnets } = useSelector(getPreferences);

  return !isTestnet || Boolean(showFiatInTestnets);
}
