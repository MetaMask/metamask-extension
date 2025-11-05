import React from 'react';
import {
  Container,
  ContainerProps,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
} from '../../../helpers/constants/design-system';

const Row = (props: ContainerProps<'div'>) => {
  return (
    <Container
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      flexWrap={FlexWrap.NoWrap}
      alignItems={AlignItems.center}
      {...props}
    />
  );
};

export default Row;
