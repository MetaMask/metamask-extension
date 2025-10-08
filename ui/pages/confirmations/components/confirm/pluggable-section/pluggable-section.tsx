import React from 'react';
import { ReactComponentLike } from 'prop-types';

import { SnapsSection } from '../snaps/snaps-section';

// Components to be plugged into confirmation page can be added to the array below
const pluggedInSections: ReactComponentLike[] = [SnapsSection];

const PluggableSection = () => {
  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section key={`section-${index}`} />
      ))}
    </>
  );
};

export default PluggableSection;
