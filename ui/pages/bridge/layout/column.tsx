// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import {
  Container,
  ContainerProps,
} from '../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

const Column = (props: ContainerProps<'div'>) => {
  return (
    <Container
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
      {...props}
    />
  );
};

export default Column;
