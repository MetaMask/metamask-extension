import React from 'react';

import syncConfirmPath from '../hooks/syncConfirmPath';
import setCurrentConfirmation from '../hooks/setCurrentConfirmation';
import { Box } from '../../../components/component-library';
import { Header } from '../components/confirm/header';
import { Footer } from '../components/confirm/footer';
import { BlockSize } from '../../../helpers/constants/design-system';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return (
    <Box height={BlockSize.Full} width={BlockSize.Full}>
      <Header />
      <Box>CONFIRMATION PAGE BODY TO COME HERE</Box>
      <Footer />
    </Box>
  );
};

export default Confirm;
