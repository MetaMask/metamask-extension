import React from 'react';
import {
  BorderColor,
  SEVERITIES,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { Text, Box } from '../../component-library';
import Callout from './callout';

export default {
  title: 'Components/UI/Callout (deprecated)',
  component: Callout,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release.',
      },
    },
  },
  argTypes: {
    severity: {
      control: {
        type: 'select',
      },
      options: Object.values(SEVERITIES),
    },
  },
};

export const DefaultStory = (args) => (
  <Box borderColor={BorderColor.borderDefault} paddingTop={8}>
    <Box margin={2}>
      <Text variant={TextVariant.headingSm} as="h4">
        This is your private key:
      </Text>
      <Text variant={TextVariant.bodySm} as="h6">
        some seed words that are super important and probably deserve a callout
      </Text>
    </Box>
    <Callout {...args}>Always back up your private key!</Callout>
  </Box>
);

DefaultStory.storyName = 'Default';
