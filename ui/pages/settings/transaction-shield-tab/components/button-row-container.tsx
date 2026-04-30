import React from 'react';
import { Box, twMerge } from '@metamask/design-system-react';

const ButtonRowContainer = ({
  'data-testid': dataTestId,
  className = '',
  children,
}: {
  'data-testid'?: string;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <Box
      className={twMerge('button-row-container', className)}
      data-testid={dataTestId}
    >
      {children}
    </Box>
  );
};

export default ButtonRowContainer;
