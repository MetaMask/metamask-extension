import React from 'react';
import { ReactComponentLike } from 'prop-types';

import { useConfirmContext } from '../../../context/confirm';
import { SnapsSection } from '../snaps/snaps-section';

// Components to be plugged into confirmation page can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const PluggableSection = () => {
  const { currentConfirmation } = useConfirmContext();

  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section key={`section-${index}`} confirmation={currentConfirmation} />
      ))}
    </>
  );
};

export default PluggableSection;
