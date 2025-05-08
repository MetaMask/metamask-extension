import { TransactionMeta } from '@metamask/transaction-controller';
import React, { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { Box, Text } from '../../../../../../../components/component-library';
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
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';
import { SelectedGasFeeToken } from '../selected-gas-fee-token';
import { useSelectedGasFeeToken } from '../../hooks/useGasFeeToken';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';

export const EditGasFeesRow = ({
  fiatFee,
  fiatFeeWith18SignificantDigits,
  nativeFee,
  supportsEIP1559,
  setShowCustomizeGasPopover,
}: {
  fiatFee: string;
  fiatFeeWith18SignificantDigits: string | null;
  nativeFee: string;
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const { chainId } = transactionMeta;
  const gasFeeToken = useSelectedGasFeeToken();
  const showFiat = useShowFiat(chainId);
  const fiatValue = gasFeeToken ? gasFeeToken.amountFiat : fiatFee;
  const tokenValue = gasFeeToken ? gasFeeToken.amountFormatted : nativeFee;
  const metamaskFeeFiat = gasFeeToken?.metamaskFeeFiat;

  const tooltip = gasFeeToken
    ? t('confirmGasFeeTokenTooltip', [metamaskFeeFiat])
    : t('estimatedFeeTooltip');

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.EstimatedFee}
        ownerId={transactionMeta.id}
        data-testid="edit-gas-fees-row"
        label={t('networkFee')}
        tooltip={tooltip}
        style={{ alignItems: AlignItems.center, marginBottom: '2px' }}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          textAlign={TextAlign.Center}
          gap={1}
        >
          {!gasFeeToken && (
            <EditGasIconButton
              supportsEIP1559={supportsEIP1559}
              setShowCustomizeGasPopover={setShowCustomizeGasPopover}
            />
          )}
          {showFiat && !showAdvancedDetails ? (
            <FiatValue
              fullValue={fiatFeeWith18SignificantDigits}
              roundedValue={fiatValue}
            />
          ) : (
            <TokenValue roundedValue={tokenValue} />
          )}
          <SelectedGasFeeToken />
        </Box>
      </ConfirmInfoAlertRow>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        paddingInline={2}
      >
        <Text
          data-testid="gas-fee-token-fee"
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
        >
          {gasFeeToken
            ? t('confirmGasFeeTokenMetaMaskFee', [metamaskFeeFiat])
            : ' '}
        </Text>
        {showAdvancedDetails && (
          <FiatValue
            fullValue={fiatFeeWith18SignificantDigits}
            roundedValue={fiatValue}
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
          />
        )}
      </Box>
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
