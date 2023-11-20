import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { Display } from '../../../helpers/constants/design-system';

import { Box, ButtonVariant, Button, Text, Modal, ModalHeader } from '..';

import { ModalContent } from './modal-content';
import { ModalContentSize } from './modal-content.types';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/ModalContent',
  component: ModalContent,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(ModalContentSize),
    },
  },
} as Meta<typeof ModalContent>;

const LoremIpsum = () => (
  <Text marginBottom={4}>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod
    tortor vitae nisi blandit, eu aliquam nisl ultricies. Donec euismod
    scelerisque nisl, sit amet aliquet nunc. Donec euismod, nisl vitae
    consectetur aliquam, nunc nunc ultricies nunc, eget aliquam nisl nisl vitae
    nunc. Donec euismod, nisl vitae consectetur aliquam, nunc nunc ultricies
    nunc, eget aliquam nisl nisl vitae nunc. Donec euismod, nisl vitae
    consectetur aliquam, nunc nunc ultricies nunc, eget aliquam nisl nisl vitae
    nunc. Donec euismod, nisl vitae consectetur aliquam, nunc
  </Text>
);

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
          <ModalHeader marginBottom={4}>Modal Header</ModalHeader>
          <Text marginBottom={4}>Modal Content</Text>
          <Button variant={ButtonVariant.Primary} onClick={handleOnClick}>
            Close
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};

DefaultStory.storyName = 'Default';

export const Children: StoryFn<typeof ModalContent> = (args) => {
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
          <ModalHeader marginBottom={4}>Modal Header</ModalHeader>
          <Text marginBottom={4}>
            The ModalContent with ModalHeader and Text components as children
          </Text>
          <Button
            marginBottom={4}
            variant={ButtonVariant.Primary}
            onClick={handleOnClick}
          >
            Close
          </Button>
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
        </ModalContent>
      </Modal>
    </>
  );
};

enum ModalContentSizeStoryOption {
  Sm = 'sm',
  ClassName = 'className',
}

export const Size: StoryFn<typeof ModalContent> = (args) => {
  const [show, setShow] = useState({
    sm: false,
    className: false,
  });
  const handleOnClick = (size: ModalContentSizeStoryOption) => {
    setShow({ ...show, [size]: !show[size] });
  };

  return (
    <>
      <Box display={Display.Flex} gap={4}>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={() => handleOnClick(ModalContentSizeStoryOption.Sm)}
        >
          Show sm size
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={() => handleOnClick(ModalContentSizeStoryOption.ClassName)}
        >
          Show className
        </Button>
      </Box>

      <Modal
        isOpen={show.sm}
        onClose={() => handleOnClick(ModalContentSizeStoryOption.Sm)}
      >
        <ModalContent {...args}>
          <Text marginBottom={4}>
            ModalContentSize.Sm default and only size 360px max-width
          </Text>
          <Button onClick={() => setShow({ ...show, sm: false })}>Close</Button>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={show.className}
        onClose={() => handleOnClick(ModalContentSizeStoryOption.ClassName)}
      >
        <ModalContent
          {...args}
          modalDialogProps={{
            style: { maxWidth: 800 },
          }}
        >
          <Text marginBottom={4}>
            Using modalDialogProps and adding a className setting a max width
            (max-width: 800px)
          </Text>
          <Button onClick={() => setShow({ ...show, className: false })}>
            Close
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};
