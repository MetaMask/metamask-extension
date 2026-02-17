import React, { useState } from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, Text, TextVariant } from '@metamask/design-system-react';
import { GlobalMenuDrawer } from './global-menu-drawer';
import { GlobalMenuDrawerWithList } from './global-menu-drawer-with-list';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';

const meta: Meta<typeof GlobalMenuDrawer> = {
  title: 'Components/Multichain/GlobalMenuDrawer',
  component: GlobalMenuDrawer,
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    showCloseButton: {
      control: 'boolean',
    },
    onClickOutside: {
      control: 'boolean',
    },
    width: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GlobalMenuDrawer>;

const DefaultWrapper = (args: React.ComponentProps<typeof GlobalMenuDrawer>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
      <GlobalMenuDrawer
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Drawer"
      >
        <div className="p-4">
          <Text variant={TextVariant.HeadingMd} className="mb-4">
            Drawer Content
          </Text>
          <Text>
            This is an example drawer built with Headless UI Dialog. It
            provides accessibility features like focus management and keyboard
            navigation out of the box.
          </Text>
        </div>
      </GlobalMenuDrawer>
    </>
  );
};

export const Default: Story = {
  render: DefaultWrapper,
};

const WithoutCloseButtonWrapper = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
      <GlobalMenuDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showCloseButton={false}
        title="Drawer without close button"
      >
        <div className="p-4">
          <Text>This drawer doesn&apos;t have a close button in the header.</Text>
          <Button onClick={() => setIsOpen(false)} className="mt-4">
            Close Drawer
          </Button>
        </div>
      </GlobalMenuDrawer>
    </>
  );
};

export const WithoutCloseButton: Story = {
  render: WithoutCloseButtonWrapper,
};

const CustomWidthWrapper = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Wide Drawer</Button>
      <GlobalMenuDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        width="600px"
        title="Wide Drawer"
      >
        <div className="p-4">
          <Text>This drawer has a custom width of 600px.</Text>
        </div>
      </GlobalMenuDrawer>
    </>
  );
};

export const CustomWidth: Story = {
  render: CustomWidthWrapper,
};

const store = configureStore(testData);

const WithGlobalMenuListWrapper = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Provider store={store}>
      <Button onClick={() => setIsOpen(true)}>Open Menu Drawer</Button>
      <GlobalMenuDrawerWithList
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </Provider>
  );
};

export const WithGlobalMenuList: Story = {
  render: WithGlobalMenuListWrapper,
};
