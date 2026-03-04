import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line import/no-extraneous-dependencies

import {
  BackgroundColor,
  AlignItems,
  BlockSize,
  JustifyContent,
  FlexDirection,
  Display,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { Box } from '../../../components/component-library';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { AmountRecipient } from '../components/send/amount-recipient';
import { Header } from '../components/send/header';
import { Asset } from '../components/send/asset';
import { Loader } from '../components/send/loader';
import { SendPages } from '../constants/send';
import { useSendContext } from '../context/send';
import { useSendQueryParams } from '../hooks/send/useSendQueryParams';

const SendContainer = ({
  children,
  onExitBack,
}: {
  children: React.ReactNode;
  onExitBack?: () => void;
}) => {
  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      className="redesigned__send__container"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
      justifyContent={JustifyContent.center}
      style={{ flex: '1 0 auto', minHeight: 0 }}
      width={BlockSize.Full}
    >
      <Box
        backgroundColor={BackgroundColor.backgroundSection}
        className="redesigned__send__wrapper"
        display={Display.Flex}
        height={BlockSize.Full}
        justifyContent={JustifyContent.center}
        width={BlockSize.Full}
        borderRadius={BorderRadius.LG}
      >
        <Box
          className="redesigned__send__content"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          height={BlockSize.Full}
          width={BlockSize.Full}
        >
          <Box className="redesigned__send__sticky-header">
            <Header onExitBack={onExitBack} />
          </Box>
          <ScrollContainer className="redesigned__send__content-wrapper">
            {children}
          </ScrollContainer>
        </Box>
      </Box>
    </Box>
  );
};

export const SendInner = () => {
  useSendQueryParams();
  const navigate = useNavigate();
  const { currentPage } = useSendContext();
  const [show, setShow] = useState(true);
  const handleExitBack = useCallback(() => setShow(false), []);

  if (currentPage === SendPages.LOADER) {
    return <Loader />;
  }

  return (
    <AnimatePresence onExitComplete={() => navigate(PREVIOUS_ROUTE)}>
      {show && (
        <motion.div
          key="send"
          className="page-enter-animation"
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{ height: '100%' }}
        >
          {currentPage === SendPages.ASSET && (
            <SendContainer onExitBack={handleExitBack}>
              <Asset />
            </SendContainer>
          )}
          {currentPage === SendPages.AMOUNTRECIPIENT && (
            <SendContainer>
              <AmountRecipient />
            </SendContainer>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
