import React from 'react';

import { Box } from '../../components/component-library';
import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';
import updateCurrentConfirmation from '../../hooks/confirm/useCurrentConfirmation';

const Confirm = () => {
  updateCurrentConfirmation();
  syncConfirmPath();

  return <Box>NEW IMPLEMENTATION TO COME HERE</Box>;
};

export default Confirm;
