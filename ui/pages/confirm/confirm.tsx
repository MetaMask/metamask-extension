import React from 'react';

import { Footer } from '../../components/app/confirm/footer';
import { Header } from '../../components/app/confirm/header';
import { SenderInfo } from '../../components/app/confirm/sender-info';
import { SignatureMessage } from '../../components/app/confirm/signature-message';
import { ConfirmTitle } from '../../components/app/confirm/title';
import { Box } from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';
import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';

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
          <ConfirmTitle />
          <SenderInfo />
          <SignatureMessage />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default Confirm;
