import React, { FunctionComponent } from 'react';
import { Box } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

export const SnapUIFooter: FunctionComponent = ({ children, ...props }) => {
  const { buttonsEnabled, requireScroll } = useSnapInterfaceContext();

  // Modify each SnapUIFooterButton child to include the disabled state
  const updatedChildren = React.Children.map(children, (child) => {
    return React.cloneElement(child as React.ReactElement, {
      disabled: requireScroll ? !buttonsEnabled : (child as React.ReactElement).props.disabled,
    });
  });

  return <Box {...props}>{updatedChildren}</Box>;
};