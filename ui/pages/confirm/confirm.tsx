import React from 'react';

import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';
import { Box } from '../../components/component-library';
import { Footer } from '../../components/app/confirm/footer';
import { Header } from '../../components/app/confirm/header';
import { ConfirmTitle } from '../../components/app/confirm/title';
import { BlockSize } from '../../helpers/constants/design-system';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return (
    <Box height={BlockSize.Full} width={BlockSize.Full}>
      <Header />
      <ConfirmTitle />
      <Box>CONFIRMATION PAGE BODY TO COME HERE</Box>
      <Footer />
    </Box>
  );
};

export default Confirm;
