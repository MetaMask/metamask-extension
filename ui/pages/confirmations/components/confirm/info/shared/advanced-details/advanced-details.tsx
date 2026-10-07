import React from 'react';
import { useSelector } from 'react-redux';
import { mmLazy } from '../../../../../../../helpers/utils/mm-lazy';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';

const AdvancedDetailsContent = mmLazy(
  () => import('./advanced-details-content'),
);

export const AdvancedDetails = ({
  overrideVisibility = false,
}: {
  overrideVisibility?: boolean;
}) => {
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  if (!overrideVisibility && !showAdvancedDetails) {
    return null;
  }

  return <AdvancedDetailsContent />;
};
