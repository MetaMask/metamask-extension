import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Box from '../../ui/box';
import {
  IconName,
  Button,
  BUTTON_SIZES,
  ButtonIcon,
  ButtonIconSize,
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
      size={ButtonIconSize.Sm}
      iconName={IconName.ArrowLeft}
      ariaLabel="back"
    />
  ),
  endAccessory: (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      iconName={IconName.Close}
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
          size={ButtonIconSize.Sm}
          iconName={IconName.ArrowLeft}
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
          size={ButtonIconSize.Sm}
          iconName={IconName.Close}
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
            size={ButtonIconSize.Sm}
            iconName={IconName.Close}
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
            size={ButtonIconSize.Sm}
            iconName={IconName.ArrowLeft}
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
            size={ButtonIconSize.Sm}
            iconName={IconName.ArrowLeft}
            ariaLabel="back"
          />
        }
        endAccessory={
          <ButtonIcon
            backgroundColor={BackgroundColor.goerli}
            size={ButtonIconSize.Sm}
            iconName={IconName.Close}
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
            size={ButtonIconSize.Sm}
            iconName={IconName.Close}
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
            size={ButtonIconSize.Sm}
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
            size={ButtonIconSize.Sm}
            iconName={IconName.Close}
            ariaLabel="close"
          />
        }
        {...args}
      ></HeaderBase>
    </Box>
  </>
);
