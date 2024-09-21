import React from 'react';
import README from './README.mdx';
import InfoTooltip from './info-tooltip';

export default {
  title: 'Components/UI/InfoTooltip',

  component: InfoTooltip,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    contentText: { control: 'text' },
    position: {
      control: 'select',
      options: ['top', 'left', 'bottom', 'right'],
    },
    containerClassName: { control: 'text' },
    wrapperClassName: { control: 'text' },
    iconFillColor: { control: 'text' },
  },
};

export const DefaultStory = (args) => <InfoTooltip {...args} />;
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  position: 'top',
  contentText:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.',
};

export const Bottom = (args) => <InfoTooltip {...args} />;
Bottom.args = {
  position: 'bottom',
  contentText:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.',
};

export const Left = (args) => <InfoTooltip {...args} />;
Left.args = {
  position: 'left',
  contentText:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.',
};

export const Right = (args) => <InfoTooltip {...args} />;
Right.args = {
  position: 'right',
  contentText:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.',
};
