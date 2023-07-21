import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  AlignItems,
  TextColor,
  BorderColor,
  BorderRadius,
  BackgroundColor,
  DISPLAY,
  IconColor,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import {
  AvatarAccount,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  Icon,
  IconName,
  IconSize,
  Tag,
} from '..';
import {
  BadgeWrapperAnchorElementShape,
  BadgeWrapperPosition,
} from './badge-wrapper.types';

import README from './README.mdx';

import { BadgeWrapper } from './badge-wrapper';

export default {
  title: 'Components/ComponentLibrary/BadgeWrapper',
  component: BadgeWrapper,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: {
      control: 'text',
    },
    badge: {
      control: 'text',
    },
    position: {
      options: Object.values(BadgeWrapperPosition),
      control: 'select',
    },
    positionObj: {
      control: 'object',
    },
    anchorElementShape: {
      options: Object.values(BadgeWrapperAnchorElementShape),
      control: 'select',
    },
    className: {
      control: 'text',
    },
  },
} as ComponentMeta<typeof BadgeWrapper>;

const Template: ComponentStory<typeof BadgeWrapper> = (args) => (
  <BadgeWrapper
    badge={
      <AvatarNetwork
        size={AvatarNetworkSize.Xs}
        name="Avalanche"
        src="./images/avax-token.png"
        borderColor={BorderColor.borderMuted}
      />
    }
    {...args}
  >
    {args.children ? (
      args.children
    ) : (
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    )}
  </BadgeWrapper>
);

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';

export const Children: ComponentStory<typeof BadgeWrapper> = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    </BadgeWrapper>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarToken
        name="Eth"
        src="./images/eth_logo.png"
        borderColor={BorderColor.borderMuted}
      />
    </BadgeWrapper>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Sm}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
    >
      <Box
        as="img"
        src="./catnip-spicywright.png"
        borderRadius={BorderRadius.SM}
        borderColor={BorderColor.borderMuted}
        style={{ width: 100, height: 100 }}
      />
    </BadgeWrapper>
  </Box>
);

export const Badge: ComponentStory<typeof BadgeWrapper> = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    </BadgeWrapper>
    <BadgeWrapper
      badge={
        <Box
          backgroundColor={BackgroundColor.successDefault}
          borderRadius={BorderRadius.full}
          borderColor={BorderColor.borderMuted}
          borderWidth={2}
          style={{ width: 12, height: 12 }}
        />
      }
    >
      <Icon
        name={IconName.Global}
        size={IconSize.Xl}
        color={IconColor.iconAlternative}
      />
    </BadgeWrapper>
    <Box
      paddingTop={1}
      paddingBottom={1}
      paddingRight={1}
      paddingLeft={1}
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.SM}
      style={{ alignSelf: 'flex-start' }}
    >
      <BadgeWrapper
        badge={
          <Tag
            label="9999"
            backgroundColor={BackgroundColor.errorDefault}
            labelProps={{ color: TextColor.errorInverse }}
            borderColor={BorderColor.errorDefault}
          />
        }
        anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      >
        <Box
          paddingTop={1}
          paddingBottom={1}
          paddingRight={8}
          paddingLeft={8}
          borderRadius={BorderRadius.SM}
          borderColor={BorderColor.borderDefault}
          backgroundColor={BackgroundColor.backgroundDefault}
        >
          NFTs
        </Box>
      </BadgeWrapper>
    </Box>
  </Box>
);

export const Position: ComponentStory<typeof BadgeWrapper> = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      position={BadgeWrapperPosition.topLeft}
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    </BadgeWrapper>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    </BadgeWrapper>
    <BadgeWrapper
      position={BadgeWrapperPosition.bottomLeft}
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    </BadgeWrapper>
    <BadgeWrapper
      position={BadgeWrapperPosition.bottomRight}
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    </BadgeWrapper>
  </Box>
);

export const PositionObj: ComponentStory<typeof BadgeWrapper> = () => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={4}>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
      positionObj={{ top: 4, right: -8 }}
    >
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    </BadgeWrapper>
  </Box>
);

export const AnchorElementShape: ComponentStory<typeof BadgeWrapper> = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      badge={
        <Box
          backgroundColor={BackgroundColor.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 16, height: 16 }}
        />
      }
    >
      <Box
        backgroundColor={BackgroundColor.infoDefault}
        borderRadius={BorderRadius.full}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      badge={
        <Box
          backgroundColor={BackgroundColor.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 8, height: 8 }}
        />
      }
    >
      <Box
        backgroundColor={BackgroundColor.infoDefault}
        borderRadius={BorderRadius.full}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      badge={
        <Box
          backgroundColor={BackgroundColor.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 16, height: 16 }}
        />
      }
    >
      <Box
        backgroundColor={BackgroundColor.infoDefault}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      badge={
        <Box
          backgroundColor={BackgroundColor.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 8, height: 8 }}
        />
      }
    >
      <Box
        backgroundColor={BackgroundColor.infoDefault}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      badge={
        <Box
          backgroundColor={BackgroundColor.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 16, height: 16 }}
        />
      }
    >
      <Box
        backgroundColor={BackgroundColor.infoDefault}
        style={{ width: 40, height: 80 }}
      />
    </BadgeWrapper>
  </Box>
);
