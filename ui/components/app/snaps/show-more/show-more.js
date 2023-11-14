import React, { useState } from 'react';
import PropTypes from 'prop-types';

import useIsOverflowing from '../../../../hooks/snaps/useIsOverflowing';
import { Box, Button, ButtonVariant, Text } from '../../../component-library';
import {
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const ShowMore = ({
  children,
  buttonBackground = BackgroundColor.backgroundDefault,
  ...props
}) => {
  const t = useI18nContext();
  const { contentRef, isOverflowing } = useIsOverflowing();
  const [isOpen, setIsOpen] = useState(false);

  const shouldDisplayButton = isOverflowing && !isOpen;

  const handleClick = () => setIsOpen(true);

  return (
    <Box
      className="show-more__wrapper"
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
        <Button
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, var(--color-${buttonBackground}) 33%)`,
          }}
          padding={0}
          paddingLeft={8}
          variant={ButtonVariant.Link}
          onClick={handleClick}
        >
          <Text color={TextColor.infoDefault}>{t('more')}</Text>
        </Button>
      )}
    </Box>
  );
};

ShowMore.propTypes = {
  children: PropTypes.node,
  buttonBackground: PropTypes.string,
};
