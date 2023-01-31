import React from 'react';

import Typography from '../typography';

import MetaFoxLogo from '.';

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
    <Typography marginTop={4} as="p">
      To view the different logo types change the build type in:
      ui/components/ui/metafox-logo/horizontal-logo.js
    </Typography>
  </>
);

DefaultStory.storyName = 'Default';
