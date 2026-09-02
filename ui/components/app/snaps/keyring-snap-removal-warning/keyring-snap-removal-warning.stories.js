import React from 'react';
import { useArgs } from '@storybook/preview-api';
import { Button } from '../../../component-library';
import KeyringSnapRemovalWarning from './keyring-snap-removal-warning';

const mockSnap = {
  id: 'mock-snap-id',
  manifest: {
    proposedName: 'ABC Snap',
  },
};

export default {
  title: 'Components/App/Snaps/KeyringSnapRemovalWarning',
  component: KeyringSnapRemovalWarning,
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onClose: {
      action: 'onClose',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    onBack: {
      action: 'onBack',
    },
    isOpen: {
      control: 'boolean',
    },
    keyringAccounts: {
      control: 'object',
    },
  },
  args: {
    snap: mockSnap,
    isOpen: false,
    keyringAccounts: [
      {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        name: 'Test Account 2',
      },
    ],
  },
};

export const DefaultStory = (args) => {
  const [{ isOpen }, updateArgs] = useArgs();
  const handleClose = () => updateArgs({ isOpen: false });

  return (
    <>
      <Button onClick={() => updateArgs({ isOpen: true })}>Open</Button>
      <KeyringSnapRemovalWarning
        {...args}
        isOpen={isOpen}
        onCancel={handleClose}
        onClose={handleClose}
        onBack={handleClose}
        onSubmit={handleClose}
      />
    </>
  );
};

DefaultStory.storyName = 'Default';
