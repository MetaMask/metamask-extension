import React, { useState, useRef } from 'react';
import { GlobalMenuDrawer } from '.';
import { ButtonPrimary } from '../../component-library';

export default {
  title: 'Components/Multichain/GlobalMenuDrawer',
  component: GlobalMenuDrawer,
  argTypes: {
    closeMenu: {
      action: 'closeMenu',
    },
    anchorElement: {
      control: false,
    },
  },
  args: {
    isOpen: false,
    closeMenu: () => undefined,
    anchorElement: null,
  },
};

export const DefaultStory = (args) => {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <ButtonPrimary ref={anchorRef} onClick={() => setIsOpen(true)}>
        Open Drawer
      </ButtonPrimary>
      <GlobalMenuDrawer
        {...args}
        isOpen={isOpen}
        anchorElement={anchorRef.current}
        closeMenu={() => {
          setIsOpen(false);
          args.closeMenu();
        }}
      />
    </>
  );
};
DefaultStory.storyName = 'Default';

export const WithContent = (args) => {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <ButtonPrimary ref={anchorRef} onClick={() => setIsOpen(true)}>
        Open Drawer
      </ButtonPrimary>
      <GlobalMenuDrawer
        {...args}
        isOpen={isOpen}
        anchorElement={anchorRef.current}
        closeMenu={() => {
          setIsOpen(false);
          args.closeMenu();
        }}
      >
        <div style={{ padding: '16px' }}>
          <h2>Drawer Content</h2>
          <p>This is some content inside the drawer.</p>
        </div>
      </GlobalMenuDrawer>
    </>
  );
};
WithContent.storyName = 'With Content';
