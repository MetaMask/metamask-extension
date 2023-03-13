import PropTypes from 'prop-types';
import React from 'react';
import {
  BackgroundColor,
  SEVERITIES,
  TextColor,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import Card from '../card';
import Typography from '../typography';
import Box from '../box';

import README from './README.mdx';

import Approve from './approve-icon.component';
import InfoIcon from './info-icon.component';
import InfoIconInverted from './info-icon-inverted.component';
import Interaction from './interaction-icon.component';
import Preloader from './preloader';
import ReceiveIcon from './receive-icon.component';
import SendIcon from './send-icon.component';
import Sign from './sign-icon.component';
import SunCheck from './sun-check-icon.component';
import Swap from './swap-icon-for-list.component';
import IconEye from './icon-eye';
import IconEyeSlash from './icon-eye-slash';
import IconTokenSearch from './icon-token-search';
import SearchIcon from './search-icon';

const validColors = [
  'var(--color-icon-default)',
  'var(--color-icon-alternative)',
  'var(--color-icon-muted)',
  'var(--color-overlay-inverse)',
  'var(--color-primary-default)',
  'var(--color-warning-default)',
  'var(--color-error-default)',
  'var(--color-warning-default)',
  'var(--color-success-default)',
  'var(--color-info-default)',
];

export default {
  title: 'Components/UI/Icon',

  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: [16, 24, 32, 40],
    },
    color: {
      control: 'select',
      options: validColors,
    },
    ariaLabel: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
};

const IconItem = ({ Component }) => {
  return (
    <Card
      display="flex"
      flexDirection="column"
      textAlign="center"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Box marginBottom={2}>{Component}</Box>
      <code>{`${Component.type.__docgenInfo.displayName}`}</code>
    </Card>
  );
};

IconItem.propTypes = {
  Component: PropTypes.node,
};

export const DefaultStory = (args) => (
  <div>
    <Typography
      variant={TypographyVariant.H2}
      color={TextColor.errorDefault}
      boxProps={{ marginBottom: 4 }}
    >
      DEPRECATED
    </Typography>
    <Typography variant={TypographyVariant.H2} boxProps={{ marginBottom: 4 }}>
      Icons
    </Typography>
    <Typography
      variant={TypographyVariant.paragraph}
      boxProps={{ marginBottom: 4 }}
    >
      To ensure correct licensing we suggest you use an icon from the
      @fortawesome/fontawesome-free: ^5.13.0 package. If there is no icon to
      suit your needs and you need to create a new one. Ensure that it has the
      correct licensing or has been created in house from scratch. Please use
      the ./icon-caret-left.js as the template.
    </Typography>
    <Box marginBottom={4}>
      <div
        style={{
          display: 'grid',
          gridGap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, 176px)',
        }}
      >
        <IconItem Component={<IconTokenSearch {...args} />} />
        <IconItem Component={<SearchIcon {...args} />} />
      </div>
    </Box>
    <Box marginBottom={4}>
      <div
        style={{
          display: 'grid',
          gridGap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, 176px)',
        }}
      >
        <IconItem Component={<Approve {...args} />} />
        <IconItem Component={<Sign {...args} />} />
        <IconItem Component={<Swap {...args} />} />
        <IconItem Component={<SendIcon {...args} />} />
        <IconItem Component={<ReceiveIcon {...args} />} />
        <IconItem Component={<Interaction {...args} />} />
        <IconItem Component={<InfoIcon {...args} />} />
        <IconItem Component={<InfoIconInverted {...args} />} />
        <IconItem Component={<SunCheck {...args} />} />
        <IconItem Component={<SunCheck {...args} reverseColors />} />
        <IconItem Component={<Preloader {...args} />} />
        <IconItem Component={<IconEye {...args} />} />
        <IconItem Component={<IconEyeSlash {...args} />} />
      </div>
    </Box>
  </div>
);

DefaultStory.args = {
  width: '17',
  height: '21',
  fill: 'var(--color-icon-default)',
  size: 40,
  color: 'var(--color-icon-default)',
  severity: 'info',
  reverseColors: false,
};

export const Size = (args) => (
  <div>
    <SunCheck size={16 || args.size} />
    <SunCheck size={24 || args.size} />
    <SunCheck size={32 || args.size} />
  </div>
);

Size.args = {
  size: null,
};

export const Color = (args) => (
  <>
    {Object.values(validColors).map((color) => (
      <SunCheck {...args} color={args.color || color} key={color} />
    ))}
  </>
);

export const AriaLabel = (args) => <SunCheck {...args} />;

AriaLabel.args = {
  ariaLabel: 'back',
};

export const ApproveStory = (args) => <Approve {...args} />;
ApproveStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
ApproveStory.storyName = 'Approve';

export const SignStory = (args) => <Sign {...args} />;
SignStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
SignStory.storyName = 'Sign';

export const SwapStory = (args) => <Swap {...args} />;
SwapStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
SwapStory.storyName = 'Swap';

export const SendIconStory = (args) => <SendIcon {...args} />;
SendIconStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
SendIconStory.storyName = 'SendIcon';

export const ReceiveIconStory = (args) => <ReceiveIcon {...args} />;
ReceiveIconStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
ReceiveIconStory.storyName = 'ReceiveIcon';

export const InteractionStory = (args) => <Interaction {...args} />;
InteractionStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
InteractionStory.storyName = 'Interaction';

export const InfoIconStory = (args) => <InfoIcon {...args} />;
InfoIconStory.args = {
  severity: SEVERITIES.INFO,
};
InfoIconStory.argTypes = {
  severity: {
    control: 'select',
    options: ['warning', 'info', 'danger', 'success'],
  },
};
InfoIconStory.storyName = 'InfoIcon';

export const InfoIconInvertedStory = (args) => <InfoIconInverted {...args} />;
InfoIconInvertedStory.args = {
  severity: SEVERITIES.INFO,
};
InfoIconInvertedStory.argTypes = {
  severity: {
    control: 'select',
    options: ['warning', 'info', 'danger', 'success'],
  },
};
InfoIconInvertedStory.storyName = 'InfoIconInverted';

export const SunCheckStory = (args) => <SunCheck {...args} />;
SunCheckStory.args = {
  reverseColors: false,
};
SunCheckStory.argTypes = {
  reverseColors: {
    control: 'boolean',
  },
};
SunCheckStory.storyName = 'SunCheck';

export const PreloaderStory = (args) => <Preloader {...args} />;
PreloaderStory.args = {
  size: 40,
};
PreloaderStory.storyName = 'Preloader';
