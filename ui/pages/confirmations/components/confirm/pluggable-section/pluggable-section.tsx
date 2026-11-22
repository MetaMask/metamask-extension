import React from 'react';
import { ReactComponentLike } from 'prop-types';
import { TransactionMeta } from '@metamask/transaction-controller';

import { useConfirmContext } from '../../../context/confirm';
import { SnapsSection } from '../snaps/snaps-section';
import { PAY_TRANSACTION_TYPES } from '../../../constants/pay';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';

// Components to be plugged into confirmation page can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const PluggableSection = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPayTransaction = hasTransactionType(
    currentConfirmation,
    PAY_TRANSACTION_TYPES,
  );

  if (isPayTransaction) {
    return null;
  }

  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section key={`section-${index}`} confirmation={currentConfirmation} />
      ))}
    </>
  );
};

export default PluggableSection;
