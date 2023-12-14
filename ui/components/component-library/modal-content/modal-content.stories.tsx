import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { Display, FlexWrap } from '../../../helpers/constants/design-system';

import {
  Box,
  ButtonVariant,
  Button,
  Text,
  Modal,
  ModalHeader,
  ModalBody,
} from '..';

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
    children: { control: 'text' },
    size: {
      control: 'select',
      options: Object.values(ModalContentSize),
    },
    modalDialogProps: { control: 'object' },
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
          <ModalHeader>Modal Header</ModalHeader>
          <ModalBody>
            <Text>Modal Content</Text>
          </ModalBody>
          <Box padding={4}>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleOnClick}
              block
            >
              Close
            </Button>
          </Box>
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
          <ModalBody>
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

enum ModalContentSizeStoryOption {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  ClassName = 'className',
}

export const Size: StoryFn<typeof ModalContent> = (args) => {
  const [currentSize, setCurrentSize] =
    useState<ModalContentSizeStoryOption | null>(null);

  const handleOnClick = (size: ModalContentSizeStoryOption) => {
    setCurrentSize(currentSize === size ? null : size);
  };

  const getSize = (size: ModalContentSizeStoryOption) => {
    switch (size) {
      case ModalContentSizeStoryOption.Sm:
        return ModalContentSize.Sm;
      case ModalContentSizeStoryOption.Md:
        return ModalContentSize.Md;
      case ModalContentSizeStoryOption.Lg:
        return ModalContentSize.Lg;
      default:
        return ModalContentSize.Sm;
    }
  };

  return (
    <>
      <Box display={Display.Flex} flexWrap={FlexWrap.Wrap} gap={4}>
        {Object.values(ModalContentSizeStoryOption).map((size) => (
          <Button
            key={size}
            variant={ButtonVariant.Secondary}
            onClick={() => handleOnClick(size)}
          >
            {`Show ${size} size`}
          </Button>
        ))}
      </Box>
      {currentSize && (
        <Modal isOpen={true} onClose={() => setCurrentSize(null)}>
          <ModalContent
            {...args}
            size={getSize(currentSize)}
            modalDialogProps={
              currentSize === ModalContentSizeStoryOption.ClassName
                ? { className: 'max-width-800' }
                : {}
            }
          >
            <ModalHeader marginBottom={4} onClose={() => setCurrentSize(null)}>
              {`ModalContent size: ${currentSize}`}
            </ModalHeader>
            <ModalBody>
              <Text marginBottom={4}>
                {currentSize === ModalContentSizeStoryOption.ClassName ? (
                  <>
                    This ModalContent has size set using modalDialogProps and
                    adding a className setting a max width (max-width: 800px){' '}
                  </>
                ) : (
                  <>This ModalContent is using size: {currentSize}</>
                )}
              </Text>
            </ModalBody>
            <Box padding={4}>
              <Button onClick={() => setCurrentSize(null)} block>
                Close
              </Button>
            </Box>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
