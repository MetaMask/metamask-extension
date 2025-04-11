import PropTypes from 'prop-types';
import React, { isValidElement } from 'react';

import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';
import Spinner from '../spinner';

const LoadingScreen = ({
  header,
  loadingMessage,
  showLoadingSpinner = true,
}) => {
  const renderMessage = () => {
    if (!loadingMessage) {
      return null;
    }

    return isValidElement(loadingMessage) ? (
      loadingMessage
    ) : (
      <span style={{ textAlign: 'center' }}>{loadingMessage}</span>
    );
  };

  return (
    <Box className="loading-overlay">
      {header}
      <Box className="loading-overlay__container" marginBottom={3}>
        {showLoadingSpinner && <Spinner className="loading-overlay__spinner" />}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        {renderMessage()}
      </Box>
    </Box>
  );
};

LoadingScreen.propTypes = {
  header: PropTypes.element,
  loadingMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  showLoadingSpinner: PropTypes.bool,
};

export default React.memo(LoadingScreen);
