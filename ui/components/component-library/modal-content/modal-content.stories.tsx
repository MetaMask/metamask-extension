import React, { useEffect, useRef, useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Box from '../../ui/box';

import { DISPLAY, BLOCK_SIZES } from '../../../helpers/constants/design-system';

import { BUTTON_VARIANT, Button, Text, ModalHeader } from '..';

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
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    size: {
      control: 'select',
      options: Object.values(ModalContentSize).map((value) =>
        value.toLowerCase(),
      ),
    },
  },
  args: {
    children: 'Modal Content',
  },
} as ComponentMeta<typeof ModalContent>;

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

const Template: ComponentStory<typeof ModalContent> = (args) => (
  <ModalContent {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children: ComponentStory<typeof ModalContent> = (args) => (
  <ModalContent {...args}>
    <ModalHeader marginBottom={4}>Modal Header</ModalHeader>
    <Text marginBottom={4}>
      The ModalContent with ModalHeader and Text components as children
    </Text>
    <LoremIpsum />
    <LoremIpsum />
    <LoremIpsum />
    <LoremIpsum />
    <LoremIpsum />
  </ModalContent>
);

enum ModalContentSizeStoryOption {
  Sm = 'sm',
  ClassName = 'className',
}

export const Size: ComponentStory<typeof ModalContent> = (args) => {
  const [show, setShow] = useState({
    sm: false,
    className: false,
  });
  const handleOnClick = (size: ModalContentSizeStoryOption) => {
    setShow({ ...show, [size]: !show[size] });
  };

  return (
    <>
      <Box display={DISPLAY.FLEX} gap={4}>
        <Button
          variant={BUTTON_VARIANT.SECONDARY}
          onClick={() => handleOnClick(ModalContentSizeStoryOption.Sm)}
        >
          Show sm size
        </Button>
        <Button
          variant={BUTTON_VARIANT.SECONDARY}
          onClick={() => handleOnClick(ModalContentSizeStoryOption.ClassName)}
        >
          Show className
        </Button>
      </Box>
      {show.sm && (
        <ModalContent {...args}>
          <Text marginBottom={4}>
            ModalContentSize.Sm default and only size 360px max-width
          </Text>
          <Button onClick={() => setShow({ ...show, sm: false })}>Close</Button>
        </ModalContent>
      )}
      {show.className && (
        <ModalContent {...args} modalDialogProps={{ style: { maxWidth: 800 } }}>
          <Text marginBottom={4}>
            Using modalDialogProps and adding a className setting a max width
            (max-width: 800px)
          </Text>
          <Button onClick={() => setShow({ ...show, className: false })}>
            Close
          </Button>
        </ModalContent>
      )}
    </>
  );
};

export const ModalDialogRef: ComponentStory<typeof ModalContent> = (args) => {
  const [show, setShow] = useState(false);
  const modalDialogRef = useRef<HTMLDivElement>(null);
  const handleClickOutside = (event: MouseEvent) => {
    if (
      modalDialogRef?.current &&
      !modalDialogRef.current.contains(event.target as Node)
    ) {
      setShow(false);
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <>
      <Button onClick={() => setShow(true)}>Show ModalContent</Button>
      {show && (
        <ModalContent {...args}>
          Click outside of this ModalContent to close
        </ModalContent>
      )}
    </>
  );
};
