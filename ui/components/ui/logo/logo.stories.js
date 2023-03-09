import PropTypes from 'prop-types';
import React from 'react';

import { BackgroundColor } from '../../../helpers/constants/design-system';

import Card from '../card';
import Box from '../box';
import Typography from '../typography';

import LogoLedger from './logo-ledger';
import LogoQRBased from './logo-qr-based';
import LogoTrezor from './logo-trezor';
import LogoLattice from './logo-lattice';

import README from './README.mdx';

export default {
  title: 'Components/UI/Logo',

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
    ariaLabel: {
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
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Box marginBottom={2}>{Component}</Box>
      <Typography>{`${Component.type.__docgenInfo.displayName}`}</Typography>
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
    <LogoItem Component={<LogoLedger {...args} />} />
    <LogoItem Component={<LogoQRBased {...args} />} />
    <LogoItem Component={<LogoTrezor {...args} />} />
    <LogoItem Component={<LogoLattice {...args} />} />
  </div>
);

DefaultStory.args = {};
