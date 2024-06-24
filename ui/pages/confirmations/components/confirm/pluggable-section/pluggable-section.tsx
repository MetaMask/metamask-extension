import React from 'react';
import { ReactComponentLike } from 'prop-types';
import { useSelector } from 'react-redux';

import { currentConfirmationSelector } from '../../../selectors';

// Components to be plugged into confirmation page can be added to the array below
const pluggedInSections: ReactComponentLike[] = [];

const PluggableSection = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  return (
    <>
      {pluggedInSections.map((Section, index) => (
        <Section key={`section-${index}`} confirmation={currentConfirmation} />
      ))}
    </>
  );
};

export default PluggableSection;
