import React from 'react';
import classnames from 'classnames';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';

import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';
import { BoxProps } from '../../../component-library/box';

import { ConfirmFooterProps } from './confirm-footer.types';

const ConfirmFooter: React.FC<ConfirmFooterProps> = ({
  className = '',
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onCancel,
  onConfirm,
  confirmButtonProps,
  cancelButtonProps,
  ...props
}) => {
  return (
    <Box
      className={classnames('confirm-footer', className)}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      gap={4}
      padding={4}
      width={BlockSize.Full}
      {...(props as BoxProps<'div'>)}
    >
      <Button
        onClick={onCancel}
        variant={ButtonVariant.Secondary}
        width={BlockSize.Full}
        {...cancelButtonProps}
        size={ButtonSize.Lg}
      >
        {cancelText}
      </Button>
      <Button
        size={ButtonSize.Lg}
        onClick={onConfirm}
        width={BlockSize.Full}
        {...confirmButtonProps}
      >
        {confirmText}
      </Button>
    </Box>
  );
};

export default ConfirmFooter;
