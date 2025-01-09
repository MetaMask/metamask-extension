import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../../components/app/confirm/info/row';
import { Box, Text } from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../../../../../helpers/constants/design-system';
import { getPreferences } from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';

export const GasFeesRow = ({
  label,
  tooltipText,
  fiatFee,
  fiatFeeWith18SignificantDigits,
  nativeFee,
  'data-testid': dataTestId,
}: {
  label: string;
  tooltipText: string;
  fiatFee: string;
  fiatFeeWith18SignificantDigits: string | null;
  nativeFee: string;
  'data-testid'?: string;
}) => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  type TestNetChainId = (typeof TEST_CHAINS)[number];
  const isTestnet = TEST_CHAINS.includes(
    transactionMeta?.chainId as TestNetChainId,
  );
  const { showFiatInTestnets } = useSelector(getPreferences);

  return (
    <ConfirmInfoRow
      data-testid={dataTestId}
      label={label}
      tooltip={tooltipText}
      variant={ConfirmInfoRowVariant.Default}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        marginLeft={8}
      >
        <Text marginRight={1} color={TextColor.textDefault}>
          {nativeFee}
        </Text>
        {(!isTestnet || showFiatInTestnets) &&
        fiatFeeWith18SignificantDigits ? (
          <Tooltip title={fiatFeeWith18SignificantDigits}>
            <Text color={TextColor.textAlternative}>{fiatFee}</Text>
          </Tooltip>
        ) : (
          <Text color={TextColor.textAlternative}>{fiatFee}</Text>
        )}
      </Box>
    </ConfirmInfoRow>
  );
};
