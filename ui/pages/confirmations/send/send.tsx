import React from 'react';

import {
  BackgroundColor,
  AlignItems,
  BlockSize,
  JustifyContent,
  FlexDirection,
  Display,
} from '../../../helpers/constants/design-system';
import { Box } from '../../../components/component-library';
import { SendContextProvider } from '../context/send';
import { SendMetricsContextProvider } from '../context/send-metrics';
import { Header } from '../components/send/header';
import { SendInner } from './send-inner';

const SendContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundAlternative}
      className="redesigned__send__container"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
      justifyContent={JustifyContent.center}
      style={{ flex: '1 0 auto', minHeight: 0 }}
      width={BlockSize.Full}
    >
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        className="redesigned__send__wrapper"
        display={Display.Flex}
        height={BlockSize.Full}
        justifyContent={JustifyContent.center}
        width={BlockSize.Full}
      >
        <Box
          className="redesigned__send__content"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          height={BlockSize.Full}
          style={{ maxWidth: '650px' }}
          width={BlockSize.Full}
        >
          <Header />
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export const Send = () => (
  <SendContextProvider>
    <SendMetricsContextProvider>
      <SendContainer>
        <SendInner />
      </SendContainer>
    </SendMetricsContextProvider>
  </SendContextProvider>
);
