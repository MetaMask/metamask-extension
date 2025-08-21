import React, { ReactNode } from 'react';
import { SnapUIBanner } from './snap-ui-banner';
import { BannerAlertSeverity } from '../../../component-library';

export default {
  title: 'Components/App/Snaps/SnapUiBanner',
  component: SnapUIBanner,
  argTypes: {
    title: {
      control: 'text',
    },
    severity: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args: {
  title: string;
  severity: BannerAlertSeverity;
  children: ReactNode;
}) => <SnapUIBanner {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  title: 'Components/App/Snaps/SnapUiBanner',
  severity: 'info',
  children: 'Banner content.',
};
