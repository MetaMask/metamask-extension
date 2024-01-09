import React from 'react';

import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';
import { Box } from '../../components/component-library';
import { Header } from '../../components/app/confirm/header';
import { Footer } from '../../components/app/confirm/footer';
import { BlockSize } from '../../helpers/constants/design-system';

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
