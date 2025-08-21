import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../../../component-library';
import SnapInstallWarning from '.';

const meta: Meta<typeof SnapInstallWarning> = {
  title: 'Components/App/Snaps/SnapInstallWarning',
  component: SnapInstallWarning,
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    snapName: {
      control: 'text',
    },
    warnings: {
      control: 'object',
    },
  },
  args: {
    snapName: 'Test Snap',
    warnings: [
      {
        id: '1',
        permissionName: 'snap_getBip32PublicKey',
        warningMessageSubject: 'BTC',
      },
      {
        id: '2',
        permissionName: 'snap_getBip44Entropy',
        warningMessageSubject: 'ETH',
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof SnapInstallWarning>;

export const Default: Story = {
  render: (args) => {
    const [showWarning, setShowWarning] = useState(false);

    const handleOpen = () => {
      setShowWarning(true);
    };

    return (
      <div>
        <Button onClick={handleOpen}>Open Warning Modal</Button>
        {showWarning && (
          <SnapInstallWarning
            {...args}
            onCancel={() => setShowWarning(false)}
            onSubmit={() => setShowWarning(false)}
          />
        )}
      </div>
    );
  },
};
