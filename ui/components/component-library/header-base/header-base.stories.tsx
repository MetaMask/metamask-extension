import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Box from '../../ui/box';
import {
  IconName,
  Button,
  ButtonIcon,
  BUTTON_ICON_SIZES,
  BUTTON_SIZES,
  Text,
  AvatarAccount,
} from '..';
import {
  FLEX_DIRECTION,
  AlignItems,
  BackgroundColor,
  TextVariant,
  JustifyContent,
  DISPLAY,
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
  children: 'Title is sentence case no period',
  startAccessory: (
    <ButtonIcon
      size={BUTTON_ICON_SIZES.SM}
      iconName={IconName.ArrowLeft}
      ariaLabel="back"
    />
  ),
  endAccessory: (
    <ButtonIcon
      size={BUTTON_ICON_SIZES.SM}
      iconName={IconName.Close}
      ariaLabel="close"
    />
  ),
};

DefaultStory.storyName = 'Default';

export const Children = (args) => {
  return (
    <>
      <HeaderBase marginBottom={4} {...args}>
        Title is sentence case no period
      </HeaderBase>
      <HeaderBase
        childrenWrapperProps={{
          variant: TextVariant.bodyLgMedium,
        }}
        marginBottom={4}
        {...args}
      >
        Updating variant of Text component to bodyLgMedium using
        childrenWrapperProps
      </HeaderBase>
      <HeaderBase
        childrenWrapperProps={{
          as: 'div',
          display: DISPLAY.FLEX,
          flexDirection: FLEX_DIRECTION.COLUMN,
          justifyContent: JustifyContent.center,
          alignItems: AlignItems.center,
        }}
        marginBottom={4}
        {...args}
      >
        <AvatarAccount
          marginBottom={2}
          address="0x1234567890123456789012345678901234567890"
        />
        <Text variant={TextVariant.headingMd}>
          Custom header with multiple children
        </Text>
      </HeaderBase>
    </>
  );
};

export const StartAccessory = (args) => {
  return (
    <HeaderBase
      marginBottom={4}
      startAccessory={
        <ButtonIcon
          size={BUTTON_ICON_SIZES.SM}
          iconName={IconName.ArrowLeft}
          ariaLabel="back"
        />
      }
      {...args}
    >
      Title is sentence case no period
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
          iconName={IconName.Close}
          ariaLabel="close"
        />
      }
      {...args}
    >
      Title is sentence case no period
    </HeaderBase>
  );
};

export const UseCaseDemos = (args) => (
  <>
    <Text>children only assigned</Text>
    <Box backgroundColor={BackgroundColor.warningAlternative}>
      <HeaderBase
        marginBottom={4}
        childrenWrapperProps={{
          backgroundColor: BackgroundColor.primaryAlternative,
        }}
        {...args}
      >
        Title is sentence case no period
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
            iconName={IconName.Close}
            ariaLabel="close"
          />
        }
        childrenWrapperProps={{
          backgroundColor: BackgroundColor.primaryAlternative,
        }}
        {...args}
      >
        Title is sentence case no period
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
            iconName={IconName.ArrowLeft}
            ariaLabel="back"
          />
        }
        childrenWrapperProps={{
          backgroundColor: BackgroundColor.primaryAlternative,
        }}
        {...args}
      >
        Title is sentence case no period
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
            iconName={IconName.ArrowLeft}
            ariaLabel="back"
          />
        }
        endAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.goerli}
            size={BUTTON_ICON_SIZES.SM}
            iconName={IconName.Close}
            ariaLabel="close"
          />
        }
        childrenWrapperProps={{
          backgroundColor: BackgroundColor.primaryAlternative,
        }}
        {...args}
      >
        Title is sentence case no period
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
            iconName={IconName.Close}
            ariaLabel="close"
          />
        }
        childrenWrapperProps={{
          backgroundColor: BackgroundColor.primaryAlternative,
        }}
        {...args}
      >
        Title is sentence case no period
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
            iconName={IconName.Close}
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
        childrenWrapperProps={{
          backgroundColor: BackgroundColor.primaryAlternative,
        }}
        {...args}
      >
        Title is sentence case no period
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
            iconName={IconName.Close}
            ariaLabel="close"
          />
        }
        {...args}
      />
    </Box>
  </>
);
