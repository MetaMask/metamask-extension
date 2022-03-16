import PropTypes from 'prop-types';
import React from 'react';
import {
  COLORS,
  SEVERITIES,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Card from '../card';
import Typography from '../typography';
import Box from '../box';

import README from './README.mdx';

import Approve from './approve-icon.component';
import BuyIcon from './overview-buy-icon.component';
import CopyIcon from './copy-icon.component';
import InfoIcon from './info-icon.component';
import InfoIconInverted from './info-icon-inverted.component';
import Interaction from './interaction-icon.component';
import PaperAirplane from './paper-airplane-icon';
import Preloader from './preloader';
import ReceiveIcon from './receive-icon.component';
import SendIcon from './send-icon.component';
import Sign from './sign-icon.component';
import SunCheck from './sun-check-icon.component';
import Swap from './swap-icon-for-list.component';
import SwapIcon from './overview-send-icon.component';
import SwapIconComponent from './swap-icon.component';
import IconCaretLeft from './icon-caret-left';
import IconCaretRight from './icon-caret-right';
import IconCaretDown from './icon-caret-down';
import IconCaretUp from './icon-caret-up';
import IconCheck from './icon-check';
import IconCog from './icon-cog';
import IconConnect from './icon-connect';
import IconImport from './icon-import';
import IconSpeechBubbles from './icon-speech-bubbles';
import IconPlus from './icon-plus';
import IconEye from './icon-eye';
import IconEyeSlash from './icon-eye-slash';

const validColors = [
  'var(--color-icon-default)',
  'var(--color-icon-muted)',
  'var(--color-overlay-inverse)',
  'var(--color-primary-default)',
  'var(--color-secondary-default)',
  'var(--color-error-default)',
  'var(--color-warning-default)',
  'var(--color-success-default)',
  'var(--color-info-default)',
];

export default {
  title: 'Components/UI/Icon',
  id: __filename,
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
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
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
    <Typography variant={TYPOGRAPHY.H2} boxProps={{ marginBottom: 4 }}>
      Icons
    </Typography>
    <Typography variant={TYPOGRAPHY.Paragraph} boxProps={{ marginBottom: 4 }}>
      If you are creating a new icon please use the ./icon-caret-left.js as the
      template
    </Typography>
    <Box marginBottom={4}>
      <div
        style={{
          display: 'grid',
          gridGap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, 176px)',
        }}
      >
        <IconItem Component={<IconCaretLeft {...args} />} />
        <IconItem Component={<IconCaretRight {...args} />} />
        <IconItem Component={<IconCaretDown {...args} />} />
        <IconItem Component={<IconCaretUp {...args} />} />
        <IconItem Component={<IconCheck {...args} />} />
        <IconItem Component={<IconPlus {...args} />} />
        <IconItem Component={<IconImport {...args} />} />
        <IconItem Component={<IconConnect {...args} />} />
        <IconItem Component={<IconSpeechBubbles {...args} />} />
        <IconItem Component={<IconCog {...args} />} />
      </div>
    </Box>
    <Typography
      variant={TYPOGRAPHY.H2}
      color={COLORS.ERROR_DEFAULT}
      boxProps={{ marginBottom: 4 }}
    >
      DEPRECATED
    </Typography>
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
        <IconItem Component={<BuyIcon {...args} />} />
        <IconItem Component={<SwapIcon {...args} />} />
        <IconItem Component={<SwapIconComponent {...args} />} />
        <IconItem Component={<PaperAirplane {...args} />} />
        <IconItem Component={<CopyIcon {...args} />} />
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
    <IconCaretLeft size={16 || args.size} />
    <IconCaretLeft size={24 || args.size} />
    <IconCaretLeft size={32 || args.size} />
  </div>
);

Size.args = {
  size: null,
};

export const Color = (args) => (
  <>
    {Object.values(validColors).map((color) => (
      <IconCaretLeft {...args} color={args.color || color} key={color} />
    ))}
  </>
);

export const AriaLabel = (args) => <IconCaretLeft {...args} />;

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

export const BuyIconStory = (args) => <BuyIcon {...args} />;
BuyIconStory.args = {
  width: '17',
  height: '21',
  fill: '#2F80ED',
};
BuyIconStory.storyName = 'BuyIcon';

export const SwapIconStory = (args) => <SwapIcon {...args} />;
SwapIconStory.args = {
  width: '17',
  height: '21',
  fill: '#2F80ED',
};
SwapIconStory.storyName = 'SwapIcon';

export const SendSwapIconStory = (args) => <SwapIconComponent {...args} />;
SendSwapIconStory.args = {
  width: '17',
  height: '17',
  color: 'var(--color-icon-default)',
};
SendSwapIconStory.storyName = 'Send/SwapIcon';

export const PaperAirplaneStory = (args) => <PaperAirplane {...args} />;
PaperAirplaneStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
PaperAirplaneStory.storyName = 'PaperAirplane';

export const CopyIconStory = (args) => <CopyIcon {...args} />;
CopyIconStory.args = {
  size: 40,
  color: 'var(--color-icon-default)',
};
CopyIconStory.storyName = 'CopyIcon';

export const PreloaderStory = (args) => <Preloader {...args} />;
PreloaderStory.args = {
  size: 40,
};
PreloaderStory.storyName = 'Preloader';
