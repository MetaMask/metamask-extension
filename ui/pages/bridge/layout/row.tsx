import React from 'react';
import { Container } from '../../../components/component-library/container/container';
import { ContainerProps } from '../../../components/component-library/container/container.types';
import { PolymorphicRef } from '../../../components/component-library/box/box.types';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
} from '../../../helpers/constants/design-system';

const Row = React.forwardRef(
  <Element extends React.ElementType = 'div' | 'button'>(
    props: ContainerProps<Element>,
    ref?: PolymorphicRef<Element>,
  ) => {
    return (
      <Container
        display={Display.Flex}
        ref={ref}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        flexWrap={FlexWrap.NoWrap}
        alignItems={AlignItems.center}
        {...props}
      />
    );
  },
);

export default Row;
