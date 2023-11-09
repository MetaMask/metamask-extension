import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  IconName,
} from '../../../component-library';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import { Page, Header, Content, Footer } from '.';

const story = {
  title: 'Components/Multichain/Page',
  component: Page,
  argTypes: {},
  args: {},
};

export default story;

const scrollingContent = 'Content '.repeat(2000);

export const DefaultStory = (args) => (
  <Page {...args}>This is the content!</Page>
);
DefaultStory.storyName = 'Default';
DefaultStory.args = {};

const pageWrapProps = {
  style: {
    width: '328px',
    height: '600px',
    border: '1px solid var(--color-border-muted)',
  },
};

const responsivePageWrapProps = {
  style: {
    width: '100%',
    height: '600px',
    border: '1px solid var(--color-border-muted)',
  },
};
export const HeaderStory = (args) => (
  <div {...pageWrapProps}>
    <Page {...args}>
      <Header
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
          />
        }
        backgroundColor={BackgroundColor.primaryAlternative}
      >
        Connect
      </Header>
      <Content backgroundColor={BackgroundColor.successAlternative}>
        Contents!
      </Content>
    </Page>
  </div>
);
export const FullscreenStory = (args) => (
  <div {...responsivePageWrapProps}>
    <Page {...args}>
      <Header
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
          />
        }
        backgroundColor={BackgroundColor.primaryAlternative}
      >
        Connect
      </Header>
      <Content background={BackgroundColor.successAlternative}>
        {scrollingContent}
      </Content>
      <Footer backgroundColor={BackgroundColor.warningAlternative}>
        <ButtonPrimary block disabled>
          Cancel
        </ButtonPrimary>
        <ButtonPrimary block>Confirm</ButtonPrimary>
      </Footer>
    </Page>
  </div>
);
FullscreenStory.storyName = 'Fullscreen';
FullscreenStory.args = {};

HeaderStory.storyName = 'Header';
HeaderStory.args = {};

export const HeaderFooterStory = (args) => (
  <div {...pageWrapProps}>
    <Page {...args}>
      <Header
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
          />
        }
        backgroundColor={BackgroundColor.primaryAlternative}
      >
        Connect
      </Header>
      <Content backgroundColor={BackgroundColor.successAlternative}>
        Content
      </Content>
      <Footer backgroundColor={BackgroundColor.warningAlternative}>
        <ButtonPrimary block disabled>
          Cancel
        </ButtonPrimary>
        <ButtonPrimary block>Confirm</ButtonPrimary>
      </Footer>
    </Page>
  </div>
);
HeaderFooterStory.storyName = 'Header + Footer';
HeaderFooterStory.args = {};

export const ScrollingStory = (args) => (
  <div {...pageWrapProps}>
    <Page {...args}>
      <Header
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
          />
        }
        backgroundColor={BackgroundColor.primaryAlternative}
      >
        Connect
      </Header>
      <Content background={BackgroundColor.successAlternative}>
        {scrollingContent}
      </Content>
      <Footer backgroundColor={BackgroundColor.warningAlternative}>
        <ButtonPrimary block disabled>
          Cancel
        </ButtonPrimary>
        <ButtonPrimary block>Confirm</ButtonPrimary>
      </Footer>
    </Page>
  </div>
);
ScrollingStory.storyName = 'Content Scrolling';
ScrollingStory.args = {};
