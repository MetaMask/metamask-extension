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
  accountGroupId,
  buttonText = 'Edit Account Name',
}: {
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
    accountGroupId: accountGroupIds[0],
    buttonText: 'Edit Account Name',
  },
};
