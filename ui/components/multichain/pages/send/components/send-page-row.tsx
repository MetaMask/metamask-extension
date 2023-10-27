import React from 'react';
import classnames from 'classnames';
import { Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { SendProps } from '../send.types';
import { BoxProps } from '../../../../component-library/box';

export const SendPageRow: React.FC<SendProps> = ({
  className = '',
  children,
  ...props
}): JSX.Element => (
  <Box
    className={classnames('multichain-send-page-row', className)}
    display={Display.Flex}
    paddingBottom={6}
    flexDirection={FlexDirection.Column}
    {...(props as BoxProps<'div'>)}
  >
    {children}
  </Box>
);
