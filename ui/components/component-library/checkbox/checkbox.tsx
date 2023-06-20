import React, { forwardRef, Ref } from 'react';
import classnames from 'classnames';
import { Box } from '..';
import { CheckboxProps } from './checkbox.types';

export const Checkbox = forwardRef(function Checkbox(
  { className = '', ...props }: CheckboxProps,
  ref: Ref<HTMLElement>,
) {
  return (
    <Box className={classnames('mm-checkbox', className)} ref={ref} {...props}>
      Hello world
    </Box>
  );
});
