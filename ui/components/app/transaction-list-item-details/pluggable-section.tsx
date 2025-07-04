// Create a new file: transaction-list-item-details/pluggable-section.js
import React from 'react';
import { ReactComponentLike } from 'prop-types';
import { SnapsSection } from './snaps-section';
import { TransactionGroup } from '../transaction-list-item/transaction-list-item.stories';

// Components to be plugged into transaction details can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const TransactionDetailsPluggableSection = ({
  transactionGroup,
}: {
  transactionGroup: TransactionGroup;
}) => {
  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section
          key={`transaction-section-${index}`}
          transactionGroup={transactionGroup}
        />
      ))}
    </>
  );
};

export default TransactionDetailsPluggableSection;
