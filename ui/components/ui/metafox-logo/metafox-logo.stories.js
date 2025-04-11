import React from 'react';

import MetaFoxLogo from '.';
import { Text } from '../../component-library';

export default {
  title: 'Components/UI/MetaFoxLogo',

  argTypes: {
    onClick: {
      action: 'onClick',
    },
    unsetIconHeight: {
      control: 'boolean',
    },
    isOnboarding: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => (
  <>
    <MetaFoxLogo {...args} />
    <Text marginTop={4} as="p">
      To view the different logo types change the build type in:
      ui/components/ui/metafox-logo/horizontal-logo.js
    </Text>
  </>
);

DefaultStory.storyName = 'Default';
