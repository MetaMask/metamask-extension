import React from 'react';
import { Container } from '../../../components/component-library/container/container';
import { ContainerProps } from '../../../components/component-library/container/container.types';
import { PolymorphicRef } from '../../../components/component-library/box/box.types';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

const Column = React.forwardRef(
  <Element extends React.ElementType = 'div'>(
    props: ContainerProps<Element>,
    ref?: PolymorphicRef<Element>,
  ) => (
    <Container
      ref={ref}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
      {...props}
    />
  ),
);

export default Column;
