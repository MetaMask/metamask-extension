// Create a new file: transaction-list-item-details/pluggable-section.js
import React from 'react';
import { ReactComponentLike } from 'prop-types';
import { SnapsSection } from './snaps-section';
import { TransactionMeta } from '../../../../app/scripts/background';

// Components to be plugged into transaction details can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const TransactionDetailsPluggableSection = ({
  transactionMeta,
}: {
  transactionMeta: TransactionMeta;
}) => {
  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section
          key={`transaction-section-${index}`}
          transactionMeta={transactionMeta}
        />
      ))}
    </>
  );
};

export default TransactionDetailsPluggableSection;
