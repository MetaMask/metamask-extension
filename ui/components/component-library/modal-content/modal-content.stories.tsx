import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { Text } from '../text';

import { ModalContent } from './modal-content';

import { Button, ButtonVariant } from '../button';
import { Modal } from '../modal';
import { ModalHeader } from '../modal-header';
import { ModalBody } from '../modal-body';
import { ModalFooter } from '../modal-footer';

export default {
  title: 'Components/ComponentLibrary/ModalContent (deprecated)',
  component: ModalContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [ModalContent from @metamask/design-system-react] instead.',
      },
    },
  },
  argTypes: {
    children: { control: 'text' },
    modalDialogProps: { control: 'object' },
  },
} as Meta<typeof ModalContent>;

export const DefaultStory: StoryFn<typeof ModalContent> = (args) => {
  const [show, setShow] = useState(false);
  const handleOnClick = () => {
    setShow(!show);
  };
  return (
    <>
      <Button variant={ButtonVariant.Primary} onClick={handleOnClick}>
        Open
      </Button>
      <Modal isOpen={show} onClose={handleOnClick}>
        <ModalContent {...args}>
          <ModalHeader>Modal Header</ModalHeader>
          <ModalBody>
            <Text>Modal Body</Text>
          </ModalBody>
          <ModalFooter
            onSubmit={handleOnClick}
            submitButtonProps={{ children: 'Close' }}
          />
        </ModalContent>
      </Modal>
    </>
  );
};

DefaultStory.storyName = 'Default';
