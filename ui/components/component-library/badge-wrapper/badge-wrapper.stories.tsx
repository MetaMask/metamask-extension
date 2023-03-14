import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Color,
  DISPLAY,
  IconColor,
  Size,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import {
  AvatarAccount,
  AvatarNetwork,
  AvatarToken,
  Icon,
  ICON_NAMES,
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
        size={Size.XS}
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

export const Children = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={Size.XS}
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
          size={Size.XS}
          name="Avalanche"
          src="./images/avax-token.png"
          borderColor={BorderColor.borderMuted}
        />
      }
    >
      <AvatarToken
        name="Eth"
        src="./images/eth_logo.svg"
        borderColor={BorderColor.borderMuted}
      />
    </BadgeWrapper>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={Size.SM}
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

export const Badge = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={Size.XS}
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
          backgroundColor={Color.successDefault}
          borderRadius={BorderRadius.full}
          borderColor={BorderColor.borderMuted}
          borderWidth={2}
          style={{ width: 12, height: 12 }}
        />
      }
    >
      <Icon
        name={ICON_NAMES.GLOBAL}
        size={Size.XL}
        color={IconColor.iconAlternative}
      />
    </BadgeWrapper>
    <Box
      paddingTop={1}
      paddingBottom={1}
      paddingRight={1}
      paddingLeft={1}
      backgroundColor={Color.backgroundAlternative}
      borderRadius={BorderRadius.SM}
      style={{ alignSelf: 'flex-start' }}
    >
      <BadgeWrapper
        badge={
          <Tag
            label="9999"
            backgroundColor={Color.errorDefault}
            labelProps={{ color: Color.errorInverse }}
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
          backgroundColor={Color.backgroundDefault}
        >
          NFTs
        </Box>
      </BadgeWrapper>
    </Box>
  </Box>
);

export const Position = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      position={BadgeWrapperPosition.topLeft}
      badge={
        <AvatarNetwork
          size={Size.XS}
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
          size={Size.XS}
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
          size={Size.XS}
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
          size={Size.XS}
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

export const PositionObj = () => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={4}>
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={Size.XS}
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

export const AnchorElementShape = () => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <BadgeWrapper
      badge={
        <Box
          backgroundColor={Color.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 16, height: 16 }}
        />
      }
    >
      <Box
        backgroundColor={Color.infoDefault}
        borderRadius={BorderRadius.full}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      badge={
        <Box
          backgroundColor={Color.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 8, height: 8 }}
        />
      }
    >
      <Box
        backgroundColor={Color.infoDefault}
        borderRadius={BorderRadius.full}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      badge={
        <Box
          backgroundColor={Color.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 16, height: 16 }}
        />
      }
    >
      <Box
        backgroundColor={Color.infoDefault}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      badge={
        <Box
          backgroundColor={Color.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 8, height: 8 }}
        />
      }
    >
      <Box
        backgroundColor={Color.infoDefault}
        style={{ width: 40, height: 40 }}
      />
    </BadgeWrapper>
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
      badge={
        <Box
          backgroundColor={Color.errorDefault}
          borderRadius={BorderRadius.full}
          style={{ width: 16, height: 16 }}
        />
      }
    >
      <Box
        backgroundColor={Color.infoDefault}
        style={{ width: 40, height: 80 }}
      />
    </BadgeWrapper>
  </Box>
);
