import React, { useState } from 'react';
import PropTypes from 'prop-types';

import useIsOverflowing from '../../../../hooks/snaps/useIsOverflowing';
import { Box, Button, ButtonVariant, Text } from '../../../component-library';
import {
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const ShowMore = ({ children, ...props }) => {
  const t = useI18nContext();
  const { contentRef, isOverflowing } = useIsOverflowing();
  const [isOpen, setIsOpen] = useState(false);

  const shouldDisplayButton = isOverflowing && !isOpen;

  const handleClick = (e) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <Box
      className="show-more"
      style={{
        position: 'relative',
        overflow: 'hidden',
        maxHeight: isOpen ? 'none' : undefined,
      }}
      ref={contentRef}
      {...props}
    >
      {children}
      {shouldDisplayButton && (
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            // Avoids see-through with muted colors
            background: `linear-gradient(90deg, transparent 0%, var(--color-${BackgroundColor.backgroundDefault}) 33%)`,
          }}
        >
          <Button
            className="show-more__button"
            padding={0}
            paddingLeft={8}
            variant={ButtonVariant.Link}
            onClick={handleClick}
          >
            <Text color={TextColor.infoDefault}>{t('more')}</Text>
          </Button>
        </Box>
      )}
    </Box>
  );
};

ShowMore.propTypes = {
  children: PropTypes.node,
  buttonBackground: PropTypes.string,
};
