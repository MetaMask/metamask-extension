import React from 'react';
import { ETH } from '../../../helpers/constants/common';

import UserPreferencedCurrencyDisplay from '.';

export default {
  title: 'Components/App/UserPreferencedCurrencyDisplay',
  id: __filename,
  argTypes: {
    'data-testid': {
      control: 'text',
    },
    prefix: {
      control: 'text',
    },
    hideLabel: {
      control: 'boolean',
    },
    showEthLogo: {
      control: 'boolean',
    },
    ethLogoHeight: {
      control: 'number',
    },
  },
  args: {
    type: ETH,
  },
};

export const DefaultStory = (args) => (
  <UserPreferencedCurrencyDisplay {...args} />
);

DefaultStory.storyName = 'Default';
