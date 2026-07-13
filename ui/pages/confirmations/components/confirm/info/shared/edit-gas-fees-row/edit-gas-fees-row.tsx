import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
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
  addedProtectionFeeFiat,
  showAddedProtectionFee,
  fiatFee,
  fiatFeeWith18SignificantDigits,
  nativeFee,
  disableUpdate,
}: {
  addedProtectionFeeFiat?: string | null;
  showAddedProtectionFee?: boolean;
  fiatFee: string;
  fiatFeeWith18SignificantDigits: string | null;
  nativeFee: string;
  disableUpdate?: boolean;
}) => {
  const t = useI18nContext();
  const fiatFormatter = useFiatFormatter();

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
  const { isSponsorshipOptedOut } = useGasSponsorshipPreference(chainId);

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
  // Only ever show the computed added-protection surcharge, or a $0.00
  // placeholder when it could not be determined. Never fall back to the
  // full network fee, which would mislabel the entire fee as the surcharge.
  const addedProtectionFeeDisplay =
    showFiat && showAddedProtectionFee
      ? addedProtectionFeeFiat || fiatFormatter(0)
      : null;

  return (
    <Box flexDirection={BoxFlexDirection.Column}>
      {isSponsorshipModalOpen && (
        <GasSponsorshipModal onClose={handleCloseSponsorshipModal} />
      )}
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.EstimatedFee}
        ownerId={transactionMeta.id}
        data-testid="edit-gas-fees-row"
        label={t('networkFee')}
        tooltip={tooltip}
        style={{ alignItems: 'center' }}
      >
        {isLoadingGasUsed ? (
          <Skeleton height={16} width={128} />
        ) : (
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.End}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
              className="text-center"
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
                <Text color={TextColor.TextDefault}>{t('unavailable')}</Text>
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
                  color={IconColor.IconAlternative}
                  data-testid="gas-sponsorship-chevron"
                />
              )}
            </Box>
            {!estimationFailed &&
              !isGasFeeSponsored &&
              addedProtectionFeeDisplay && (
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                  data-testid="added-protection-network-fee"
                >
                  {t('addedProtectionIncludesNetworkFee', [
                    addedProtectionFeeDisplay,
                  ])}
                </Text>
              )}
            {isGasFeeSponsored && (
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
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
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          paddingHorizontal={2}
        >
          <Box style={{ marginTop: gasFeeToken ? -8 : 0 }}>
            <Text
              data-testid="gas-fee-token-fee"
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className={gasFeeToken ? 'pb-2' : ''}
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
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
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
    <Text color={TextColor.TextDefault} data-testid="first-gas-field">
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
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
      data-testid="paid-by-meta-mask"
    >
      <Icon
        name={IconName.Check}
        size={IconSize.Sm}
        color={IconColor.SuccessDefault}
      />
      <Text color={TextColor.SuccessDefault}>{t('paidByMetaMask')}</Text>
    </Box>
  );
}

function useShowFiat(chainId: Hex): boolean {
  type TestNetChainId = (typeof TEST_CHAINS)[number];

  const isTestnet = TEST_CHAINS.includes(chainId as TestNetChainId);
  const { showFiatInTestnets } = useSelector(getPreferences);

  return !isTestnet || Boolean(showFiatInTestnets);
}
