import React from 'react';
import { Button, ButtonVariant } from '@metamask/design-system-react';
import { Display } from '../../../../../../helpers/constants/design-system';
import { Footer } from '.';

const story = {
  title: 'Components/Multichain/Page/Footer',
  component: Footer,
  argTypes: {},
  args: {},
};

export default story;

export const DefaultStory = (args) => (
  <Footer {...args}>
    <Button variant={ButtonVariant.Primary} isFullWidth>
      Confirm
    </Button>
  </Footer>
);
DefaultStory.storyName = 'Default';
DefaultStory.args = {};

export const CancelConfirm = (args) => (
  <Footer {...args} display={Display.Flex} gap={4}>
    <Button variant={ButtonVariant.Primary} isFullWidth isDisabled>
      Cancel
    </Button>
    <Button variant={ButtonVariant.Primary} isFullWidth>
      Confirm
    </Button>
  </Footer>
);
DefaultStory.storyName = 'Default';
DefaultStory.args = {};
