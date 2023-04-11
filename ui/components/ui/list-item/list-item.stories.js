import React from 'react';
import PropTypes from 'prop-types';
import Send from '../icon/send-icon.component';
import Interaction from '../icon/interaction-icon.component';
import Approve from '../icon/approve-icon.component';
import Receive from '../icon/receive-icon.component';
import Preloader from '../icon/preloader';
import Button from '../button';
import ListItem from './list-item.component';

export default {
  title: 'Components/UI/ListItem',

  argTypes: {
    title: {
      control: 'text',
    },
    subtitle: {
      control: 'text',
    },
    primaryCurrency: {
      control: 'text',
    },
    secondaryCurrency: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    title: 'Send DAI',
    subtitle: 'Sept 20 · To: 00X4...3058',
    primaryCurrency: '2 ETH',
    secondaryCurrency: '70 USD',
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

const okColor = 'var(--color-primary-default)';
const failColor = 'var(--color-error-default';

export const SendComponent = (args) => (
  <ListItem
    icon={<Send color={okColor} size={28} />}
    titleIcon={<Preloader size={16} color={failColor} />}
    title={args.title}
    subtitle={args.subtitle}
    className={args.className}
    rightContent={
      <Currencies
        primary={args.primaryCurrency}
        secondary={args.secondaryCurrency}
      />
    }
  >
    <div style={{ display: 'flex', marginTop: 8 }}>
      <Button type="secondary" style={{ marginRight: 16, maxWidth: 150 }}>
        {args.secondaryButtonText}
      </Button>
      <Button style={{ maxWidth: 150 }}>{args.cancelButtonText}</Button>
    </div>
  </ListItem>
);

SendComponent.argTypes = {
  secondaryButtonText: {
    control: 'text',
  },
  cancelButtonText: {
    control: 'text',
  },
};

SendComponent.args = {
  secondaryButtonText: 'Speed up',
  cancelButtonText: 'Cancel',
};

export const PendingComponent = (args) => (
  <ListItem
    title={args.title}
    subtitle={args.subtitle}
    icon={<Interaction color={failColor} size={28} />}
    className={args.className}
    subtitleStatus={
      <span>
        <span style={{ color: 'var(--color-warning-default)' }}>
          Unapproved
        </span>{' '}
        ·{' '}
      </span>
    }
    rightContent={
      <Currencies
        primary={args.primaryCurrency}
        secondary={args.secondaryCurrency}
      />
    }
  />
);

export const ApproveComponent = (args) => (
  <ListItem
    title={args.title}
    subtitle={args.subtitle}
    icon={<Approve color={okColor} size={28} />}
    className={args.className}
    rightContent={
      <Currencies
        primary={args.primaryCurrency}
        secondary={args.secondaryCurrency}
      />
    }
  />
);

export const ReceiveComponent = (args) => (
  <ListItem
    {...args}
    icon={<Receive color={okColor} size={28} />}
    className={args.className}
    rightContent={
      <Currencies
        primary={args.primaryCurrency}
        secondary={args.secondaryCurrency}
      />
    }
  />
);
