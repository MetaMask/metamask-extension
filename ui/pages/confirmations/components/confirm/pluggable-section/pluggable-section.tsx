import React from 'react';
import { ReactComponentLike } from 'prop-types';

import { useSignatureRequestOptional } from '../../../hooks/useSignatureRequest';
import { useTransactionMetadataRequestOptional } from '../../../hooks/useTransactionMetadataRequest';
import { SnapsSection } from '../snaps/snaps-section';

// Components to be plugged into confirmation page can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const PluggableSection = () => {
  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;

  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section key={`section-${index}`} confirmation={currentConfirmation} />
      ))}
    </>
  );
};

export default PluggableSection;
