import React from 'react';

import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { Footer } from '../../components/app/confirm/footer';
import { Header } from '../../components/app/confirm/header';
import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';
import updateCurrentConfirmation from '../../hooks/confirm/updateCurrentConfirmation';

const Confirm = () => {
  updateCurrentConfirmation();
  syncConfirmPath();

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      <Header />
      <Box height={BlockSize.Full}>NET IMPLEMENTATION TO COME HERE`</Box>
      <Footer />
    </Box>
  );
};

export default Confirm;
