import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  TextField,
} from '@metamask/design-system-react';
import { Modal, ModalContent, ModalPriority, ModalProvider } from '.';

const PriorityExample = () => {
  const [ordinary, setOrdinary] = useState(false);
  const [urgent, setUrgent] = useState(false);
  return (
    <ModalProvider>
      <Button onClick={() => setOrdinary(true)}>Open ordinary dialog</Button>
      <Modal isOpen={ordinary} onClose={() => setOrdinary(false)}>
        <ModalOverlay />
        <ModalContent modalDialogProps={{ 'aria-label': 'Ordinary dialog' }}>
          <ModalHeader onClose={() => setOrdinary(false)}>
            Ordinary dialog
          </ModalHeader>
          <ModalBody>
            <label>
              Draft preserved during interruption
              <TextField
                inputProps={{
                  'aria-label': 'Draft preserved during interruption',
                }}
              />
            </label>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setUrgent(true)}>Open urgent dialog</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={urgent}
        priority={ModalPriority.Urgent}
        onClose={() => setUrgent(false)}
      >
        <ModalOverlay />
        <ModalContent modalDialogProps={{ 'aria-label': 'Urgent dialog' }}>
          <ModalHeader onClose={() => setUrgent(false)}>
            Urgent dialog
          </ModalHeader>
          <ModalBody>
            The ordinary dialog resumes after this one closes.
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setUrgent(false)}>
              Resume ordinary dialog
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ModalProvider>
  );
};

export default {
  title: 'Components/App/ModalLayer',
  component: PriorityExample,
} satisfies Meta<typeof PriorityExample>;

export const Priority: StoryObj<typeof PriorityExample> = {};
