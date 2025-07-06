// Create a new file: transaction-list-item-details/pluggable-section.js
import React from 'react';
import { ReactComponentLike } from 'prop-types';
import { SnapsSection } from './snaps-section';
import { TransactionMeta } from '../../../../app/scripts/background';

// Components to be plugged into transaction details can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const TransactionDetailsPluggableSection = (props) => {
  console.log('kylan pluggable-section.tsx props', props); // not receiving transactionMeta
  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section
          key={`transaction-section-${index}`}
          transactionMeta={props?.transactionMeta}
        />
      ))}
    </>
  );
};

export default TransactionDetailsPluggableSection;
