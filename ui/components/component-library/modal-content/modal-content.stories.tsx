import React, { useEffect, useRef, useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  DISPLAY,
  JustifyContent,
  AlignItems,
  BLOCK_SIZES,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { Button, Text } from '..';

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

const Template: ComponentStory<typeof ModalContent> = (args) => (
  <ModalContent {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

/*
 * !!TODO: Replace with ModalHeader component
 */
const ModalHeader = () => (
  <>
    <Box
      className="mm-modal-header"
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.flexStart}
      width={BLOCK_SIZES.FULL}
      marginBottom={4}
    >
      <button>Back</button>
      <Text variant={TextVariant.headingSm} textAlign={TEXT_ALIGN.CENTER}>
        Modal Header
      </Text>
      <button>Close</button>
    </Box>
  </>
);

export const Children: ComponentStory<typeof ModalContent> = (args) => (
  <ModalContent {...args}>
    <ModalHeader />
    <Text>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio,
      reiciendis assumenda dolorum mollitia saepe, optio at aliquam molestias
      omnis quae corporis nesciunt natus, quas tempore ut ullam eaque fuga.
      Velit.
    </Text>
  </ModalContent>
);

export const Size: ComponentStory<typeof ModalContent> = (args) => (
  <>
    <ModalContent {...args} marginBottom={4}>
      <Text>ModalContentSize.Sm default and only size 360px max-width</Text>
    </ModalContent>
    <ModalContent
      {...args}
      width={[
        BLOCK_SIZES.FULL,
        BLOCK_SIZES.THREE_FOURTHS,
        BLOCK_SIZES.HALF,
        BLOCK_SIZES.ONE_THIRD,
      ]}
      marginBottom={4}
    >
      <Text>
        Using width Box props and responsive array props <br /> [
        BLOCK_SIZES.FULL, BLOCK_SIZES.THREE_FOURTHS, BLOCK_SIZES.HALF,
        BLOCK_SIZES.ONE_THIRD, ]
      </Text>
    </ModalContent>
    <ModalContent {...args} marginBottom={4} style={{ maxWidth: 800 }}>
      Adding a className and setting a max width (max-width: 800px)
    </ModalContent>
  </>
);

export const ModalContentRef: ComponentStory<typeof ModalContent> = (args) => {
  const [show, setShow] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const handleClickOutside = (event: MouseEvent) => {
    if (
      modalContentRef?.current &&
      !modalContentRef.current.contains(event.target as Node)
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
        <ModalContent {...args} modalContentRef={modalContentRef}>
          Click outside of this ModalContent to close
        </ModalContent>
      )}
    </>
  );
};
