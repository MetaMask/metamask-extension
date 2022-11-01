import React from 'react';
import { SIZES, COLORS } from '../../../helpers/constants/design-system';
import { ICON_NAMES } from '../icon/icon.constants';
import README from './README.mdx';
import { PickerNetwork } from './picker-network';

export default {
  title: 'Components/ComponentLibrary/PickerNetwork',
  id: __filename,
  component: PickerNetwork,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
  },
  args: {
    label: 'Imported',
    networkName: 'Arbitrum One',
    networkImageUrl: './images/arbitrum.svg',
    size: SIZES.MD,
    showHalo: false,
    name: ICON_NAMES.ARROW_DOWN,
    color: COLORS.INHERIT,
  },
};

export const DefaultStory = (args) => <PickerNetwork {...args} />;

DefaultStory.storyName = 'Default';
