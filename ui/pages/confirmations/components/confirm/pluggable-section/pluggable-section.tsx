import React from 'react';
import { ReactComponentLike } from 'prop-types';
import { useSelector } from 'react-redux';

import { currentConfirmationSelector } from '../../../selectors';

// Components to be plugged into confirmation page can be added to the array below
const PluggedInSections: Array<ReactComponentLike> = [];

const PluggableSection = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  return (
    <>
      {PluggedInSections.map((Section) => (
        <Section confirmation={currentConfirmation} />
      ))}
    </>
  );
};

export default PluggableSection;
