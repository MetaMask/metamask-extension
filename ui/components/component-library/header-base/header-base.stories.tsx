import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Text } from '../text';

import {
  TextVariant,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { HeaderBase } from './header-base';
import { ButtonIcon, ButtonIconSize } from '../button-icon';
import { IconName } from '../icon';

export default {
  title: 'Components/ComponentLibrary/HeaderBase (deprecated)',
  component: HeaderBase,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [HeaderBase from @metamask/design-system-react] instead.',
      },
    },
  },
} as Meta<typeof HeaderBase>;

const Template: StoryFn<typeof HeaderBase> = (args) => <HeaderBase {...args} />;

export const DefaultStory = Template.bind({});

DefaultStory.args = {
  children: (
    <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
      Title is sentence case no period
    </Text>
  ),
  startAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Md}
      iconName={IconName.ArrowLeft}
      ariaLabel="back"
    />
  ),
  endAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Md}
      iconName={IconName.Close}
      ariaLabel="close"
    />
  ),
};

DefaultStory.storyName = 'Default';
