import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box } from '..';

import { TemplateProps, TemplateComponent } from './template.types';

export const Template: TemplateComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    { className = '', ...props }: TemplateProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames('mm-template', className)}
        ref={ref}
        {...(props as BoxProps<C>)}
      >
        Template
      </Box>
    );
  },
);
