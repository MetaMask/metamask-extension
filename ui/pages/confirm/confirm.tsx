import React from 'react';

import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';
import { Box } from '../../components/component-library';
import { Header } from '../../components/app/confirm/header';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return (
    <Box>
      <Header />
      <Box>CONFIRMATION PAGE BODY TO COME HERE</Box>
    </Box>
  );
};

export default Confirm;
