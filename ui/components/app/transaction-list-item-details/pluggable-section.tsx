import React from 'react';
import { ReactComponentLike } from 'prop-types';
import { SnapsSection } from './snaps-section';

// Components to be plugged into transaction details can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const TransactionDetailsPluggableSection = ({
  transactionId,
}: {
  transactionId: string;
}) => {
  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section
          key={`transaction-section-${index}`}
          transactionId={transactionId}
        />
      ))}
    </>
  );
};

export default TransactionDetailsPluggableSection;
