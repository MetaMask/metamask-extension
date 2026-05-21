import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import { AlertSeverity } from '../../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../../helpers/constants/design-system';
import { mmLazy } from '../../../../../../helpers/utils/mm-lazy';

const ShieldIconAnimationContent = mmLazy(
  // eslint-disable-next-line import-x/extensions -- needed for mmLazy
  () => import('./shield-icon-animation-content.tsx'),
);

const ShieldIconAnimation = ({
  // TODO: Update with neutral severity
  severity = Severity.Info,
  isDisabled = true,
}: {
  severity?: AlertSeverity;
  isDisabled?: boolean;
}) => {
  return (
    <Suspense
      fallback={<Box className="riv-animation__shield-icon-container" />}
    >
      <ShieldIconAnimationContent severity={severity} isDisabled={isDisabled} />
    </Suspense>
  );
};

export default ShieldIconAnimation;
