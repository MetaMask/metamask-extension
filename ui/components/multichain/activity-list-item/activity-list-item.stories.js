import React from 'react';
import PropTypes from 'prop-types';
import {
  AvatarIcon,
  Box,
  ButtonPrimary,
  ButtonSecondary,
} from '../../component-library';
import { Display } from '../../../helpers/constants/design-system';
import { ActivityListItem } from './activity-list-item';

export default {
  title: 'Components/Multichain/ActivityListItem',
  argTypes: {
    title: {
      control: 'text',
    },
    subtitle: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    topContent: {
      control: 'text',
    },
    midContent: {
      control: 'text',
    },
    children: {
      control: 'element',
    },
    rightContent: {
      control: 'text',
    },
  },
  args: {
    topContent: 'Sept 20',
    icon: <AvatarIcon />,
    title: 'Send DAI',
    subtitle: 'Pending',
    children: (
      <Box display={Display.Flex} gap={2}>
        <ButtonPrimary>button1</ButtonPrimary>
        <ButtonSecondary>button2</ButtonSecondary>
      </Box>
    ),
    // midContent: 'midcontent',
    rightContent: <Currencies primary="2 ETH" secondary="70 USD" />,
  },
};

function Currencies({ primary, secondary }) {
  return (
    <div>
      <div>{primary}</div>
      <div>{secondary}</div>
    </div>
  );
}

Currencies.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.string,
};

export const DefaultStory = (args) => <ActivityListItem {...args} />;

DefaultStory.storyName = 'Default';
