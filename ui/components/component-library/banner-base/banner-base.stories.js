import React from 'react';
import { useState } from '@storybook/addons';
import { SIZES } from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES, ButtonLink, ButtonPrimary } from '..';
import { BannerBase } from './banner-base';
import README from './README.mdx';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/BannerBase',
  id: __filename,
  component: BannerBase,
  parameters: {
    docs: {
      page: README,
    },
    backgrounds: { default: 'alternative' },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
};

export const DefaultStory = (args) => {
  const onClose = () => console.log('BannerBase onClose trigger');
  return <BannerBase {...args} onClose={onClose} />;
};

DefaultStory.args = {
  title: 'Title is sentence case no period',
  description: "Description shouldn't repeat title. 1-3 lines.",
  action: <ButtonLink size={SIZES.AUTO}>Action</ButtonLink>,
  leftAccessory: <Icon name={ICON_NAMES.INFO_FILLED} size={SIZES.LG} />,
};

DefaultStory.storyName = 'Default';

export const Title = (args) => {
  return <BannerBase {...args} />;
};

Title.args = {
  title: 'Title is sentence case no period',
  description: 'Pass only a string through the title prop',
};

export const Description = (args) => {
  return <BannerBase {...args} />;
};

Description.args = {
  description: (
    <>
      {`Description shouldn't repeat title. 1-3 lines. Can contain a `}
      <ButtonLink size={SIZES.AUTO} href="https://metamask.io/" target="_blank">
        hyperlink.
      </ButtonLink>
    </>
  ),
};

export const Action = (args) => {
  return <BannerBase {...args} />;
};

Action.args = {
  title: 'Action prop demo',
  description: 'Call to action items will appear below this description',
  action: <ButtonLink size={SIZES.AUTO}>Action</ButtonLink>,
};

export const OnClose = (args) => {
  const [isShown, setShown] = useState(true);
  const bannerToggle = () => {
    if (isShown) {
      console.log('close button clicked');
    }
    setShown(!isShown);
  };
  return (
    <>
      {isShown ? (
        <BannerBase {...args} onClose={bannerToggle} />
      ) : (
        <ButtonPrimary onClick={bannerToggle}>View BannerBase</ButtonPrimary>
      )}
    </>
  );
};

OnClose.args = {
  title: 'onClose demo',
  description: 'Click the close button icon to hide this notifcation',
};

export const LeftAccessory = (args) => {
  return <BannerBase {...args} />;
};

LeftAccessory.args = {
  title: 'Left accessory demo',
  description:
    'The info icon on the left is passed through the leftAccessory prop',
  leftAccessory: <Icon name={ICON_NAMES.INFO_FILLED} size={SIZES.LG} />,
};
