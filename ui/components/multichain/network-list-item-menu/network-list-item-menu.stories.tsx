import React, { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { Button } from '@metamask/design-system-react';
import { NetworkListItemMenu } from './network-list-item-menu';

const mockStore = configureStore({
  metamask: {
    currentLocale: 'en',
  },
});

const meta: Meta<typeof NetworkListItemMenu> = {
  title: 'Components/Multichain/NetworkListItemMenu',
  component: NetworkListItemMenu,
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <div
          style={{
            padding: '100px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NetworkListItemMenu>;

const NetworkListItemMenuWithButton = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const setAnchorRef = useCallback((node: HTMLButtonElement | null) => {
    setAnchorElement(node);
  }, []);

  return (
    <div>
      <Button ref={setAnchorRef} onClick={() => setIsOpen(!isOpen)}>
        Toggle Network Menu
      </Button>
      <NetworkListItemMenu
        {...args}
        anchorElement={anchorElement}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <NetworkListItemMenuWithButton {...args} />,
  args: {
    onDiscoverClick: () => console.log('Discover clicked'),
    onEditClick: () => console.log('Edit clicked'),
    onDeleteClick: () => console.log('Delete clicked'),
    isClosing: false,
  },
};
