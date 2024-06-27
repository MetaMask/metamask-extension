import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../../../../../shared/constants/common';
import {
  addHexes,
  getEthConversionFromWeiHex,
  getValueFromWeiHex,
} from '../../../../../../../../shared/modules/conversion.utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../../components/app/confirm/info/row';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../../../../../components/component-library';
import { getConversionRate } from '../../../../../../../ducks/metamask/metamask';
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
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  currentConfirmationSelector,
  getCurrentCurrency,
} from '../../../../../../../selectors';

const TotalFeesRow = ({
  currentCurrencyTotalFees,
  nativeCurrencyTotalFees,
}: {
  currentCurrencyTotalFees: string | null;
  nativeCurrencyTotalFees: string | null | undefined;
}) => {
  return (
    <ConfirmInfoRow label="Total" variant={ConfirmInfoRowVariant.Default}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        style={{ flexGrow: '1' }}
        marginLeft={8}
      >
        <Text color={TextColor.textAlternative}>
          {currentCurrencyTotalFees}
        </Text>
        <Text color={TextColor.textAlternative}>{nativeCurrencyTotalFees}</Text>
      </Box>
    </ConfirmInfoRow>
  );
};

const Layer1FeesRow = ({
  currentCurrencyL1Fees,
  nativeCurrencyL1Fees,
}: {
  currentCurrencyL1Fees: string | null;
  nativeCurrencyL1Fees: string | null | undefined;
}) => {
  return (
    <ConfirmInfoRow label="L1 Fees" variant={ConfirmInfoRowVariant.Default}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        style={{ flexGrow: '1' }}
        marginLeft={8}
      >
        <Text color={TextColor.textAlternative}>{currentCurrencyL1Fees}</Text>
        <Text color={TextColor.textAlternative}>{nativeCurrencyL1Fees}</Text>
      </Box>
    </ConfirmInfoRow>
  );
};

const Layer2FeesRow = ({
  currentCurrencyFees,
  nativeCurrencyFees,
}: {
  currentCurrencyFees: string;
  nativeCurrencyFees: string | undefined;
}) => {
  return (
    <ConfirmInfoRow label="L2 Fees" variant={ConfirmInfoRowVariant.Default}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        style={{ flexGrow: '1' }}
        marginLeft={8}
      >
        <Text color={TextColor.textAlternative}>{currentCurrencyFees}</Text>
        <Text color={TextColor.textAlternative}>{nativeCurrencyFees}</Text>
      </Box>
    </ConfirmInfoRow>
  );
};

const Layer2GasFeesExpandBtn = ({
  expandFeeDetails,
  setExpandFeeDetails,
}: {
  expandFeeDetails: boolean;
  setExpandFeeDetails: (currentExpandFeeDetails: boolean) => void;
}) => {
  const t = useI18nContext();

  return (
    <Box
      padding={4}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
    >
      <Button
        style={{ textDecoration: 'none' }}
        size={ButtonSize.Sm}
        variant={ButtonVariant.Link}
        endIconName={expandFeeDetails ? IconName.ArrowUp : IconName.ArrowDown}
        color={IconColor.primaryDefault}
        data-testid="expand-fee-details-button"
        onClick={() => setExpandFeeDetails(!expandFeeDetails)}
      >
        <Text variant={TextVariant.bodySm} color={IconColor.primaryDefault}>
          {t('feeDetails')}
        </Text>
      </Button>
    </Box>
  );
};

export const Layer2GasFeesDetails = ({
  gasEstimate,
}: {
  gasEstimate: string;
}) => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (!transactionMeta?.txParams) {
    return null;
  }

  const fiatFormatter = useFiatFormatter();

  const currentCurrency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);

  const nativeCurrencyFees = getEthConversionFromWeiHex({
    value: gasEstimate,
    fromCurrency: EtherDenomination.GWEI,
    numberOfDecimals: 4,
  });
  const currentCurrencyFees = fiatFormatter(
    Number(
      getValueFromWeiHex({
        value: gasEstimate,
        conversionRate,
        fromCurrency: EtherDenomination.GWEI,
        toCurrency: currentCurrency,
        numberOfDecimals: 2,
      }),
    ),
  );

  const layer1GasFee = transactionMeta?.layer1GasFee ?? null;
  const hasLayer1GasFee = layer1GasFee !== null;
  const [expandFeeDetails, setExpandFeeDetails] = useState(false);

  // L1
  const nativeCurrencyL1Fees = layer1GasFee
    ? getEthConversionFromWeiHex({
        value: layer1GasFee,
        fromCurrency: EtherDenomination.GWEI,
        numberOfDecimals: 4,
      })
    : null;

  const currentCurrencyL1Fees = layer1GasFee
    ? fiatFormatter(
        Number(
          getValueFromWeiHex({
            value: layer1GasFee,
            conversionRate,
            fromCurrency: EtherDenomination.GWEI,
            toCurrency: currentCurrency,
            numberOfDecimals: 2,
          }),
        ),
      )
    : null;

  // Total
  const getTransactionFeeTotal = useMemo(() => {
    return addHexes(gasEstimate, (layer1GasFee as string) ?? 0);
  }, [gasEstimate, layer1GasFee]);

  const nativeCurrencyTotalFees = layer1GasFee
    ? getEthConversionFromWeiHex({
        value: getTransactionFeeTotal,
        fromCurrency: EtherDenomination.GWEI,
        numberOfDecimals: 4,
      })
    : null;

  const currentCurrencyTotalFees = layer1GasFee
    ? fiatFormatter(
        Number(
          getValueFromWeiHex({
            value: getTransactionFeeTotal,
            conversionRate,
            fromCurrency: EtherDenomination.GWEI,
            toCurrency: currentCurrency,
            numberOfDecimals: 2,
          }),
        ),
      )
    : null;

  return (
    <>
      {hasLayer1GasFee && (
        <Layer2GasFeesExpandBtn
          expandFeeDetails={expandFeeDetails}
          setExpandFeeDetails={setExpandFeeDetails}
        />
      )}
      {hasLayer1GasFee && expandFeeDetails && (
        <>
          <Layer2FeesRow
            currentCurrencyFees={currentCurrencyFees}
            nativeCurrencyFees={nativeCurrencyFees}
          />
          <Layer1FeesRow
            currentCurrencyL1Fees={currentCurrencyL1Fees}
            nativeCurrencyL1Fees={nativeCurrencyL1Fees}
          />
          <TotalFeesRow
            currentCurrencyTotalFees={currentCurrencyTotalFees}
            nativeCurrencyTotalFees={nativeCurrencyTotalFees}
          />
        </>
      )}
    </>
  );
};
