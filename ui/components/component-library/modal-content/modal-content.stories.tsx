import React from 'react';
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

import { Text } from '..';

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
    <ModalContent {...args} size={ModalContentSize.Sm} marginBottom={4}>
      ModalContentSize.Sm
    </ModalContent>
    <ModalContent {...args} size={ModalContentSize.Md} marginBottom={4}>
      ModalContentSize.Md
    </ModalContent>
    <ModalContent {...args} size={ModalContentSize.Lg} marginBottom={4}>
      ModalContentSize.Lg
    </ModalContent>
  </>
);

export const Ref: ComponentStory<typeof ModalContent> = (args) => {
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  return (
    <>
      <ModalContent {...args} boxRef={modalContentRef}>
        Modal with ref
      </ModalContent>
    </>
  );
};
