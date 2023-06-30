import React from 'react';
import { Severity } from '../../../helpers/constants/design-system';
import { BannerAlert } from '../../component-library';

import IconBorder from './icon-border';

export default {
  title: 'Components/UI/IconBorder',
  component: IconBorder,
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    size: {
      control: 'number',
    },
  },
  args: {
    className: '',
    children: 'D',
    size: 32,
  },
};

export const DefaultStory = (args) => (
  <>
    <BannerAlert
      severity={Severity.Warning}
      title="Deprecated"
      description="<IconBorder/> has been deprecated in favor of the <AvatarBase /> component"
      marginBottom={4}
    />
    <IconBorder {...args} />
  </>
);

DefaultStory.storyName = 'Default';
