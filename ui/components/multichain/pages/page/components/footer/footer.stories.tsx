import React from 'react';
import { ButtonPrimary } from '../../../../../component-library';
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
    <ButtonPrimary block>Confirm</ButtonPrimary>
  </Footer>
);
DefaultStory.storyName = 'Default';
DefaultStory.args = {};

export const CancelConfirm = (args) => (
  <Footer {...args} display={Display.Flex} gap={4}>
    <ButtonPrimary block disabled>
      Cancel
    </ButtonPrimary>
    <ButtonPrimary block>Confirm</ButtonPrimary>
  </Footer>
);
DefaultStory.storyName = 'Default';
DefaultStory.args = {};
