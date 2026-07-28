import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { BlockSize, Display } from '../../../helpers/constants/design-system';

import { Text } from '../text';
import { Modal } from './modal';

import { ButtonLink, ButtonLinkSize } from '../button-link';
import { Box } from '../box';
import { Button } from '../button';
import { IconName } from '../icon';
import { ModalOverlay } from '../modal-overlay';
import { ModalContent } from '../modal-content';
import { ModalHeader } from '../modal-header';
import { ModalBody } from '../modal-body';
import { ModalFooter } from '../modal-footer';

export default {
  title: 'Components/ComponentLibrary/Modal (deprecated)',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [Modal from @metamask/design-system-react] instead.',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    onClose: {
      action: 'onClose',
    },
    children: {
      control: 'node',
    },
    className: {
      control: 'string',
    },
    isClosedOnOutsideClick: {
      control: 'boolean',
    },
    isClosedOnEscapeKey: {
      control: 'boolean',
    },
    initialFocusRef: {
      control: 'object',
    },
    finalFocusRef: {
      control: 'object',
    },
    restoreFocus: {
      control: 'boolean',
    },
    autoFocus: {
      control: 'boolean',
    },
  },
  args: {
    children: <Text>ModalBody children</Text>,
  },
} as Meta<typeof Modal>;

const LoremIpsum = (props) => (
  <Text marginBottom={8} {...props}>
    Lorem ipsum dolor sit amet, conse{' '}
    <ButtonLink size={ButtonLinkSize.Inherit}>
      random focusable button
    </ButtonLink>{' '}
    ctetur adipiscing elit. Phasellus posuere nunc enim, quis efficitur dolor
    tempus viverra. Vivamus pharetra tempor pulvinar. Sed at dui in nisi
    fermentum volutpat. Proin ut tortor quis eros tincidunt molestie.
    Suspendisse dictum ex vitae metus consequat, et efficitur dolor luctus.
    Integer ultricies hendrerit turpis sed faucibus. Nam pellentesque metus a
    turpis sollicitudin vehicula. Phasellus rutrum luctus pulvinar. Phasellus
    quis accumsan urna. Praesent justo erat, bibendum ac volutpat ac, placerat
    in dui. Cras gravida mi et risus feugiat vulputate. Integer vulputate diam
    eu vehicula euismod. In laoreet quis eros sed tincidunt. Pellentesque purus
    dui, luctus id sem sit amet, varius congue dui
  </Text>
);

const Template: StoryFn<typeof Modal> = (args) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoremIpsum, setShowLoremIpsum] = useState(true);
  const [showMoreModalContent, setShowMoreModalContent] = useState(true);

  const handleOnClick = () => {
    setIsOpen(true);
  };
  const handleOnClose = () => {
    setIsOpen(false);
  };
  const handleHideLoremIpsum = () => {
    setShowLoremIpsum(!showLoremIpsum);
  };
  const handleMoreContent = () => {
    setShowMoreModalContent(!showMoreModalContent);
  };

  return (
    <Box width={BlockSize.Full} style={{ maxWidth: '700px' }}>
      <Box display={Display.Flex} gap={4}>
        <Button onClick={handleOnClick}>Open modal</Button>
        <ButtonLink
          endIconName={showLoremIpsum ? IconName.Arrow2Up : IconName.Arrow2Down}
          onClick={handleHideLoremIpsum}
        >
          {showLoremIpsum ? 'Hide' : 'Show'} scrollable content
        </ButtonLink>
      </Box>
      <Modal {...args} isOpen={isOpen} onClose={handleOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleOnClose}>Modal Header</ModalHeader>
          <ModalBody>
            {args.children}
            <Text>Show more content to check scrolling</Text>
            <ButtonLink
              endIconName={
                showLoremIpsum ? IconName.Arrow2Up : IconName.Arrow2Down
              }
              onClick={handleMoreContent}
              size={ButtonLinkSize.Inherit}
              marginBottom={2}
            >
              {showMoreModalContent ? 'Hide' : 'Show more'}
            </ButtonLink>
            {showMoreModalContent && (
              <>
                <LoremIpsum marginTop={8} />
                <LoremIpsum />
                <LoremIpsum />
                <LoremIpsum />
                <LoremIpsum />
                <LoremIpsum />
              </>
            )}
          </ModalBody>
          <ModalFooter onSubmit={handleOnClose} onCancel={handleOnClose} />
        </ModalContent>
      </Modal>
      {showLoremIpsum && (
        <>
          <LoremIpsum marginTop={8} />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
          <LoremIpsum />
        </>
      )}
    </Box>
  );
};
export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
