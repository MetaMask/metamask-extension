import React from 'react';
import { ContainerProps } from '../../../components/component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import Column from './column';

const SpacerBox = (props: ContainerProps<'div'>) => {
  return <Column height={BlockSize.Full} {...props} />;
};

export default SpacerBox;
