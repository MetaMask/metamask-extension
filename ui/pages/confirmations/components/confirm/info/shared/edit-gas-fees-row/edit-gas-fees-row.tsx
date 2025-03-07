import { TransactionMeta } from '@metamask/transaction-controller';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
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
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getPreferences } from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';
import Name from '../../../../../../../components/app/name';
import { TokenGasFeeModal } from '../token-gas-fee-modal/token-gas-fee-modal';

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

  const [tokenModalVisible, setTokenModalVislbe] = useState(false);

  const { chainId, selectedGasFeeToken } = transactionMeta;

  type TestNetChainId = (typeof TEST_CHAINS)[number];
  const isTestnet = TEST_CHAINS.includes(
    transactionMeta.chainId as TestNetChainId,
  );
  const { showFiatInTestnets } = useSelector(getPreferences);

  return (
    <>
      {tokenModalVisible && (
        <TokenGasFeeModal onClose={() => setTokenModalVislbe(false)} />
      )}
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.EstimatedFee}
        ownerId={transactionMeta.id}
        data-testid="edit-gas-fees-row"
        label={t('networkFee')}
        tooltip={t('estimatedFeeTooltip')}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          textAlign={TextAlign.Center}
        >
          <EditGasIconButton
            supportsEIP1559={supportsEIP1559}
            setShowCustomizeGasPopover={setShowCustomizeGasPopover}
          />
          {!selectedGasFeeToken && (
            <Text
              marginRight={1}
              color={TextColor.textDefault}
              data-testid="first-gas-field"
              onClick={() => setTokenModalVislbe(true)}
            >
              {nativeFee}
            </Text>
          )}
          {selectedGasFeeToken && (
            <Name
              value={selectedGasFeeToken}
              type={NameType.ETHEREUM_ADDRESS}
              variation={chainId}
              preferContractSymbol={true}
            />
          )}
          {(!isTestnet || showFiatInTestnets) &&
            (fiatFeeWith18SignificantDigits ? (
              <Tooltip title={fiatFeeWith18SignificantDigits}>
                <Text
                  marginRight={2}
                  color={TextColor.textAlternative}
                  data-testid="native-currency"
                >
                  {fiatFee}
                </Text>
              </Tooltip>
            ) : (
              <Text
                marginRight={2}
                color={TextColor.textAlternative}
                data-testid="native-currency"
              >
                {fiatFee}
              </Text>
            ))}
        </Box>
      </ConfirmInfoAlertRow>
    </>
  );
};
