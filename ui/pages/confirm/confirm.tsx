import React from 'react';

import { Box } from '../../components/component-library';
import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return <Box>NEW IMPLEMENTATION TO COME HERE</Box>;
};

export default Confirm;
