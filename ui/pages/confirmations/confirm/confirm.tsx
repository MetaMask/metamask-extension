import React from 'react';

import { Box } from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
import { SignatureMessage } from '../components/confirm/signature-message';
import { Title } from '../components/confirm/title';
import setCurrentConfirmation from '../hooks/setCurrentConfirmation';
import syncConfirmPath from '../hooks/syncConfirmPath';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundAlternative}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      width={BlockSize.Full}
    >
      <Box>
        <Header />
        <Box paddingInline={4}>
          <Title />
          <Info />
          <SignatureMessage />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default Confirm;
