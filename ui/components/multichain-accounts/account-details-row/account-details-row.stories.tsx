import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ButtonIcon, ButtonIconSize } from '../../component-library';
import { IconName } from '../../component-library/icon';
import { IconColor } from '../../../helpers/constants/design-system';
import { AccountDetailsRow } from './account-details-row';

export default {
  title: 'Components/MultichainAccounts/AccountDetailsRow',
  component: AccountDetailsRow,
  parameters: {
    docs: {
      description: {
        component: 'A reusable row component for displaying account details with a label, value, and optional end accessory.',
      },
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'The label text displayed on the left side',
    },
    value: {
      control: 'text',
      description: 'The value text displayed on the right side',
    },
    endAccessory: {
      control: false,
      description: 'React node displayed after the value (typically a button or icon)',
    },
    style: {
      control: 'object',
      description: 'Additional CSS styles to apply to the row',
    },
  },
  args: {
    label: 'Account Name',
    value: 'My Wallet',
  },
} as Meta<typeof AccountDetailsRow>;

const Template: StoryFn<typeof AccountDetailsRow> = (args) => (
  <div style={{ width: '360px', margin: '0 auto' }}>
    <AccountDetailsRow {...args} />
  </div>
);

export const Default = Template.bind({});
Default.storyName = 'Default';

export const WithEditButton = Template.bind({});
WithEditButton.args = {
  label: 'Account Name',
  value: 'Account 1',
  endAccessory: (
    <ButtonIcon
      iconName={IconName.Edit}
      color={IconColor.iconAlternative}
      size={ButtonIconSize.Md}
      ariaLabel="Edit account name"
      marginLeft={2}
    />
  ),
};

export const WithArrowButton = Template.bind({});
WithArrowButton.args = {
  label: 'Address',
  value: '0x1234...5678',
  endAccessory: (
    <ButtonIcon
      iconName={IconName.ArrowRight}
      color={IconColor.iconAlternative}
      size={ButtonIconSize.Md}
      ariaLabel="View details"
      marginLeft={2}
    />
  ),
};

export const MultipleRows: StoryFn<typeof AccountDetailsRow> = () => (
  <div style={{ width: '360px', margin: '0 auto' }}>
    <AccountDetailsRow
      label="Account Name"
      value="Account 1"
      endAccessory={
        <ButtonIcon
          iconName={IconName.Edit}
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="Edit account name"
          marginLeft={2}
        />
      }
      style={{
        marginBottom: '1px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
      }}
    />
    <AccountDetailsRow
      label="Address"
      value="0x1234...5678"
      endAccessory={
        <ButtonIcon
          iconName={IconName.ArrowRight}
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="View QR code"
          marginLeft={2}
        />
      }
      style={{
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      }}
    />
  </div>
);
