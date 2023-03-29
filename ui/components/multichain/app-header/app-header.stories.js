import React from 'react';
import { AppHeader } from '.';

export default {
  title: 'Components/Multichain/AppHeader',
  component: AppHeader,
  argTypes: {},
  args: {},
};

export const DefaultStory = (args) => <AppHeader {...args} />;
DefaultStory.storyName = 'Default';

export const PopupStory = (args) => (
  <div
    style={{ width: '500px', border: '1px solid var(--color-border-muted)' }}
  >
    <AppHeader {...args} />
  </div>
);
PopupStory.storyName = 'Popup width';

export const UnknownNetworkStory = (args) => (
  <div
    style={{ width: '500px', border: '1px solid var(--color-border-muted)' }}
  >
    <AppHeader {...args} />
  </div>
);
UnknownNetworkStory.storyName = 'Unknown network width';

export const ChaosStory = (args) => (
  <div
    style={{ width: '500px', border: '1px solid var(--color-border-muted)' }}
  >
    <AppHeader {...args} />
  </div>
);
ChaosStory.storyName = 'Chaos';
