import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../../components/app/confirm/info/row';
import { Text } from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { TextColor } from '../../../../../../../helpers/constants/design-system';
import { getPreferences } from '../../../../../../../../shared/lib/selectors/preferences';
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
        className="flex"
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        style={{ textAlign: 'center' }}
        marginLeft={8}
      >
        <Text marginRight={1} color={TextColor.textDefault}>
          {nativeFee}
        </Text>
        {(!isTestnet || showFiatInTestnets) &&
          fiatFee &&
          (fiatFeeWith18SignificantDigits ? (
            <Tooltip title={fiatFeeWith18SignificantDigits}>
              <Text color={TextColor.textAlternative}>{fiatFee}</Text>
            </Tooltip>
          ) : (
            <Text color={TextColor.textAlternative}>{fiatFee}</Text>
          ))}
      </Box>
    </ConfirmInfoRow>
  );
};
