import PropTypes from 'prop-types';
import React from 'react';

import { COLORS } from '../../../helpers/constants/design-system';

import Card from '../card';
import Box from '../box';

import LogoMoonPay from './logo-moonpay';
import LogoWyre from './logo-wyre';
import LogoTransak from './logo-transak';
import LogoDepositEth from './logo-deposit-eth';

import README from './README.mdx';

export default {
  title: 'Components/UI/Logo',
  id: __filename,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    color: {
      control: 'text',
    },
    size: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
};

const LogoItem = ({ Component }) => {
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

LogoItem.propTypes = {
  Component: PropTypes.node,
};

export const DefaultStory = (args) => (
  <div
    style={{
      display: 'grid',
      gridGap: '16px',
      gridTemplateColumns: 'repeat(auto-fill, 176px)',
    }}
  >
    <LogoItem Component={<LogoWyre {...args} />} />
    <LogoItem Component={<LogoTransak {...args} />} />
    <LogoItem Component={<LogoDepositEth {...args} />} />
    <LogoItem Component={<LogoMoonPay {...args} />} />
  </div>
);

DefaultStory.args = {};
