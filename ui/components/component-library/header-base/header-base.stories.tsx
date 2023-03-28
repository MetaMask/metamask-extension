import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Box from '../../ui/box';
import {
  ICON_NAMES,
  Button,
  ButtonIcon,
  BUTTON_ICON_SIZES,
  BUTTON_SIZES,
  Text,
} from '..';
import {
  AlignItems,
  BackgroundColor,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { HeaderBase } from './header-base';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/HeaderBase',
  component: HeaderBase,
  parameters: {
    docs: {
      page: README,
    },
  },
} as ComponentMeta<typeof HeaderBase>;

const Template: ComponentStory<typeof HeaderBase> = (args) => (
  <HeaderBase {...args} />
);

export const DefaultStory = Template.bind({});

DefaultStory.args = {
  children: (
    <Text variant={TextVariant.headingSm} textAlign={TEXT_ALIGN.CENTER}>
      Title is sentence case no period
    </Text>
  ),
  startAccessory: (
    <ButtonIcon
      size={BUTTON_ICON_SIZES.SM}
      iconName={ICON_NAMES.ARROW_LEFT}
      ariaLabel="back"
    />
  ),
  endAccessory: (
    <ButtonIcon
      size={BUTTON_ICON_SIZES.SM}
      iconName={ICON_NAMES.CLOSE}
      ariaLabel="close"
    />
  ),
};

DefaultStory.storyName = 'Default';

export const Children = (args) => {
  return (
    <HeaderBase {...args}>
      <Text variant={TextVariant.headingSm} textAlign={TEXT_ALIGN.CENTER}>
        Title is sentence case no period
      </Text>
    </HeaderBase>
  );
};

export const StartAccessory = (args) => {
  return (
    <HeaderBase
      marginBottom={4}
      startAccessory={
        <ButtonIcon
          size={BUTTON_ICON_SIZES.SM}
          iconName={ICON_NAMES.ARROW_LEFT}
          ariaLabel="back"
        />
      }
      {...args}
    >
      <Text variant={TextVariant.headingSm} textAlign={TEXT_ALIGN.CENTER}>
        Title is sentence case no period
      </Text>
    </HeaderBase>
  );
};

export const EndAccessory = (args) => {
  return (
    <HeaderBase
      marginBottom={4}
      endAccessory={
        <ButtonIcon
          size={BUTTON_ICON_SIZES.SM}
          iconName={ICON_NAMES.CLOSE}
          ariaLabel="close"
        />
      }
      {...args}
    >
      <Text variant={TextVariant.headingSm} textAlign={TEXT_ALIGN.CENTER}>
        Title is sentence case no period
      </Text>
    </HeaderBase>
  );
};

export const UseCaseDemos = (args) => (
  <>
    <Text>children only assigned</Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase marginBottom={4} {...args}>
        <Text
          variant={TextVariant.headingSm}
          textAlign={TEXT_ALIGN.CENTER}
          backgroundColor={BackgroundColor.primaryAlternative}
        >
          Title is sentence case no period
        </Text>
      </HeaderBase>
    </Box>
    <Text>children and endAccessory assigned </Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase
        marginBottom={4}
        endAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.goerli}
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        {...args}
      >
        <Text
          variant={TextVariant.headingSm}
          textAlign={TEXT_ALIGN.CENTER}
          backgroundColor={BackgroundColor.primaryAlternative}
        >
          Title is sentence case no period
        </Text>
      </HeaderBase>
    </Box>
    <Text>children and startAccessory assigned </Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase
        marginBottom={4}
        startAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.successAlternative}
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.ARROW_LEFT}
            ariaLabel="back"
          />
        }
        {...args}
      >
        <Text
          variant={TextVariant.headingSm}
          textAlign={TEXT_ALIGN.CENTER}
          backgroundColor={BackgroundColor.primaryAlternative}
        >
          Title is sentence case no period
        </Text>
      </HeaderBase>
    </Box>
    <Text>children, startAccessory, and endAccessory assigned </Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase
        marginBottom={4}
        startAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.successAlternative}
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.ARROW_LEFT}
            ariaLabel="back"
          />
        }
        endAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.goerli}
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        {...args}
      >
        <Text
          variant={TextVariant.headingSm}
          textAlign={TEXT_ALIGN.CENTER}
          backgroundColor={BackgroundColor.primaryAlternative}
        >
          Title is sentence case no period
        </Text>
      </HeaderBase>
    </Box>
    <Text>children, startAccessory, and endAccessory assigned </Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase
        marginBottom={4}
        startAccessory={
          <Button
            backgroundColor={BackgroundColor.successAlternative}
            style={{ whiteSpace: 'nowrap' }}
            size={BUTTON_SIZES.SM}
          >
            Unlock Now
          </Button>
        }
        endAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.goerli}
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        {...args}
      >
        <Text
          variant={TextVariant.headingSm}
          textAlign={TEXT_ALIGN.CENTER}
          backgroundColor={BackgroundColor.primaryAlternative}
        >
          Title is sentence case no period
        </Text>
      </HeaderBase>
    </Box>
    <Text>
      children, startAccessory, and endAccessory assigned with prop alignItems=
      {AlignItems.center} passed at HeaderBase
    </Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase
        marginBottom={4}
        alignItems={AlignItems.center}
        startAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.successAlternative}
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        endAccessory={
          <Button
            backgroundColor={BackgroundColor.goerli}
            size={BUTTON_SIZES.SM}
          >
            Download
          </Button>
        }
        {...args}
      >
        <Text
          variant={TextVariant.headingSm}
          textAlign={TEXT_ALIGN.CENTER}
          backgroundColor={BackgroundColor.primaryAlternative}
        >
          Title is sentence case no period
        </Text>
      </HeaderBase>
    </Box>
    <Text>startAccessory and endAccessory assigned </Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase
        marginBottom={4}
        startAccessory={
          <Button
            backgroundColor={BackgroundColor.successAlternative}
            size={BUTTON_SIZES.SM}
          >
            Unlock
          </Button>
        }
        endAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.goerli}
            size={BUTTON_ICON_SIZES.SM}
            iconName={ICON_NAMES.CLOSE}
            ariaLabel="close"
          />
        }
        {...args}
      ></HeaderBase>
    </Box>
  </>
);
