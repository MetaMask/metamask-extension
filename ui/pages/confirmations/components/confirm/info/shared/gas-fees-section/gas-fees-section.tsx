import { TransactionMeta } from '@metamask/transaction-controller';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useCallback, useState } from 'react';
import { EditGasModes } from '../../../../../../../../shared/constants/gas';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useConfirmContext } from '../../../../../context/confirm';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditGasPopover from '../../../../edit-gas-popover';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { GasFeesDetails } from '../gas-fees-details/gas-fees-details';

const LegacyTransactionGasModal = ({
  closeCustomizeGasPopover,
  transactionMeta,
}: {
  closeCustomizeGasPopover: () => void;
  transactionMeta: TransactionMeta;
}) => {
  return (
    <EditGasPopover
      onClose={closeCustomizeGasPopover}
      mode={EditGasModes.modifyInPlace}
      transaction={transactionMeta}
    />
  );
};

export const GasFeesSection = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const [showCustomizeGasPopover, setShowCustomizeGasPopover] = useState(false);
  const closeCustomizeGasPopover = useCallback(
    () => setShowCustomizeGasPopover(false),
    [setShowCustomizeGasPopover],
  );

  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <ConfirmInfoSection data-testid="gas-fee-section">
      <GasFeesDetails setShowCustomizeGasPopover={setShowCustomizeGasPopover} />
      {!supportsEIP1559 && showCustomizeGasPopover && (
        <LegacyTransactionGasModal
          closeCustomizeGasPopover={closeCustomizeGasPopover}
          transactionMeta={transactionMeta}
        />
      )}
    </ConfirmInfoSection>
  );
};
