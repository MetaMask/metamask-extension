import React from 'react';

import { Footer } from '../../components/app/confirm/footer';
import { Header } from '../../components/app/confirm/header';
import { SenderInfo } from '../../components/app/confirm/sender-info';
import { ConfirmTitle } from '../../components/app/confirm/title';
import { Box } from '../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
} from '../../helpers/constants/design-system';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';
import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return (
    <Box height={BlockSize.Full} width={BlockSize.Full}>
      <Header />
      <Box
        backgroundColor={BackgroundColor.backgroundAlternative}
        paddingInline={4}
      >
        <ConfirmTitle />
        <SenderInfo />
        <Box>CONFIRMATION PAGE BODY TO COME HERE</Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default Confirm;
