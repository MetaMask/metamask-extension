import React, { useState } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { ButtonPrimary } from '../../component-library';
import { MultichainAccountEditModal } from './multichain-account-edit-modal';
import { AccountGroupId } from '@metamask/account-api';

const accountGroupIds: AccountGroupId[] = [
  'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0',
];

const ModalWithTrigger = ({
  currentAccountName,
  accountGroupId,
  buttonText = 'Edit Account Name',
}: {
  currentAccountName: string;
  accountGroupId: AccountGroupId;
  buttonText: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <ButtonPrimary onClick={handleOpen} data-testid="open-modal-button">
        {buttonText}
      </ButtonPrimary>
      <MultichainAccountEditModal
        isOpen={isOpen}
        onClose={handleClose}
        currentAccountName={currentAccountName}
        accountGroupId={accountGroupId}
      />
    </>
  );
};

const meta: Meta<typeof ModalWithTrigger> = {
  title: 'Components/MultichainAccounts/MultichainAccountEditModal',
  component: ModalWithTrigger,
  parameters: {
    docs: {
      description: {
        component: 'A modal dialog for editing a multichain account name.',
      },
    },
  },
  argTypes: {
    currentAccountName: {
      control: 'text',
      description: 'The current name of the account',
    },
    accountGroupId: {
      control: 'select',
      options: accountGroupIds,
      description: 'The unique ID of the account group',
    },
    buttonText: {
      control: 'text',
      description: 'Text for the button that opens the modal',
    },
  },
  decorators: [(Story) => <Story />],
};

export default meta;
type Story = StoryObj<typeof ModalWithTrigger>;

export const Default: Story = {
  args: {
    currentAccountName: 'Account 1',
    accountGroupId: accountGroupIds[0],
    buttonText: 'Edit Account Name',
  },
};

export const WithLongAccountName: Story = {
  args: {
    currentAccountName:
      'My Very Long Account Name That Might Cause Layout Issues In The Modal Component',
    accountGroupId: accountGroupIds[0],
    buttonText: 'Edit Account With Long Name',
  },
};
