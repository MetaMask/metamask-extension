import React from 'react';
import PropTypes from 'prop-types';
import { text } from '@storybook/addon-knobs';
import Send from '../icon/send-icon.component';
import Interaction from '../icon/interaction-icon.component';
import Approve from '../icon/approve-icon.component';
import Receive from '../icon/receive-icon.component';
import Preloader from '../icon/preloader';
import Button from '../button';
import ListItem from './list-item.component';

export default {
  title: 'ListItem',
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

const okColor = '#2F80ED';
const failColor = '#D73A49';

export const send = () => (
  <ListItem
    icon={<Send color={okColor} size={28} />}
    titleIcon={<Preloader size={16} color="#D73A49" />}
    title={text('title', 'Send DAI')}
    className="list-item"
    subtitle={text('subtitle', 'Sept 20 · To: 00X4...3058')}
    rightContent={
      <Currencies
        primary={text('primaryCurrency', '- 0.0732 DAI')}
        secondary={text('secondaryCurrency', '- $6.04 USD')}
      />
    }
  >
    <div style={{ display: 'flex', marginTop: 8 }}>
      <Button type="secondary" style={{ marginRight: 16, maxWidth: 150 }}>
        {text('button1', 'Speed Up')}
      </Button>
      <Button style={{ maxWidth: 150 }}>{text('button2', 'Cancel')}</Button>
    </div>
  </ListItem>
);

export const pending = () => (
  <ListItem
    icon={<Interaction color={failColor} size={28} />}
    title={text('title', 'Hatch Turtles')}
    className="list-item"
    subtitleStatus={
      <span>
        <span style={{ color: '#F56821' }}>Unapproved</span> ·{' '}
      </span>
    }
    subtitle={text('subtitle', 'Turtlefarm.com')}
    rightContent={
      <Currencies
        primary={text('primaryCurrency', '- 0.0732 ETH')}
        secondary={text('secondaryCurrency', '- $6.00 USD')}
      />
    }
  />
);

export const approve = () => (
  <ListItem
    icon={<Approve color={okColor} size={28} />}
    title={text('title', 'Approve spend limit')}
    className="list-item"
    subtitle={text('subtitle', 'Sept 20 · oxuniverse.com')}
    rightContent={
      <Currencies
        primary={text('primaryCurrency', '- 0 ETH')}
        secondary={text('secondaryCurrency', '- $0.00 USD')}
      />
    }
  />
);

export const receive = () => (
  <ListItem
    icon={<Receive color={okColor} size={28} />}
    title={text('title', 'Hatch Turtles')}
    className="list-item"
    subtitle={text('subtitle', 'Sept 20 · From: 00X4...3058')}
    rightContent={
      <Currencies
        primary={text('primaryCurrency', '7.5 ETH')}
        secondary={text('secondaryCurrency', '$1,425.00 USD')}
      />
    }
  />
);
