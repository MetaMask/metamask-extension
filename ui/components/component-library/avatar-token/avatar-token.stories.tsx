import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
  DISPLAY,
  AlignItems,
  TextColor,
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import {
  AvatarNetwork,
  BUTTON_LINK_SIZES,
  BadgeWrapper,
  ButtonLink,
  Text,
} from '..';

import { AvatarBaseSize } from '../avatar-base/avatar-base.types';
import README from './README.mdx';

import { AvatarToken } from './avatar-token';

export default {
  title: 'Components/ComponentLibrary/AvatarToken',
  component: AvatarToken,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AvatarBaseSize),
    },
    color: {
      options: Object.values(TextColor),
      control: 'select',
    },
    backgroundColor: {
      options: Object.values(BackgroundColor),
      control: 'select',
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
    },
    name: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
    showHalo: {
      control: 'boolean',
    },
  },
  args: {
    name: 'eth',
    src: './images/eth_logo.png',
    size: AvatarBaseSize.Md,
    showHalo: false,
  },
} as ComponentMeta<typeof AvatarToken>;

const Template: ComponentStory<typeof AvatarToken> = (args) => {
  return <AvatarToken {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory: ComponentStory<typeof AvatarToken> = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.baseline}
      gap={2}
      marginBottom={4}
    >
      <AvatarToken {...args} size={AvatarBaseSize.Xs} />
      <AvatarToken {...args} size={AvatarBaseSize.Sm} />
      <AvatarToken {...args} size={AvatarBaseSize.Md} />
      <AvatarToken {...args} size={AvatarBaseSize.Lg} />
      <AvatarToken {...args} size={AvatarBaseSize.Xl} />
    </Box>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexEnd}
      gap={2}
      marginBottom={4}
    >
      <AvatarToken {...args} src="" size={AvatarBaseSize.Xs} />
      <AvatarToken {...args} src="" size={AvatarBaseSize.Sm} />
      <AvatarToken {...args} src="" size={AvatarBaseSize.Md} />
      <AvatarToken {...args} src="" size={AvatarBaseSize.Lg} />
      <AvatarToken {...args} src="" size={AvatarBaseSize.Xl} />
    </Box>
    <Text marginBottom={4}>
      Sizes with{' '}
      <ButtonLink
        size={BUTTON_LINK_SIZES.INHERIT}
        href="/docs/components-componentlibrary-buttonlink--default-story"
      >
        AvatarNetwork
      </ButtonLink>{' '}
      and{' '}
      <ButtonLink
        size={BUTTON_LINK_SIZES.INHERIT}
        href="/docs/components-componentlibrary-badgewrapper--default-story"
      >
        BadgeWrapper
      </ButtonLink>{' '}
      components
    </Text>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexEnd}
      gap={2}
      marginBottom={4}
    >
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarBaseSize.Xs} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarBaseSize.Sm} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarBaseSize.Md} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarBaseSize.Lg} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={AvatarBaseSize.Sm}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarBaseSize.Xl} />
      </BadgeWrapper>
    </Box>
    <Box display={DISPLAY.FLEX} alignItems={AlignItems.flexEnd} gap={2}>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          src=""
          name="ETH"
          size={AvatarBaseSize.Xs}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarBaseSize.Sm}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarBaseSize.Md}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarBaseSize.Xs}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarBaseSize.Lg}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarBaseSize.Sm}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarBaseSize.Xl}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
    </Box>
  </>
);
SizeStory.storyName = 'Size';

export const Name = Template.bind({});
Name.args = {
  src: '',
};

export const Src: ComponentStory<typeof AvatarToken> = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarToken {...args} src="./images/eth_logo.png" />
    <AvatarToken {...args} src="./images/arbitrum.svg" />
    <AvatarToken {...args} src="./images/bnb.png" />
    <AvatarToken
      {...args}
      src="https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png"
    />
    <AvatarToken
      {...args}
      src="https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x0d8775f648430679a709e98d2b0cb6250d2887ef.png"
    />
    <AvatarToken
      {...args}
      src="https://static.metaswap.codefi.network/api/v1/tokenIcons/1/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png"
    />
    <AvatarToken
      {...args}
      src="https://i.seadn.io/gae/lSm8ChaI-3RqC9MTpi0j3KBXdfdPd57PN5UeQLY49JA3twy9wSt2dpaa22sSc6oyiXi2OEUR6GeFX8jwkZHEMADu6_Bd4EwTJ-rg?w=500&auto=format"
    />
  </Box>
);

export const ShowHalo = Template.bind({});
ShowHalo.args = {
  showHalo: true,
};

export const ColorBackgroundColorAndBorderColor: ComponentStory<
  typeof AvatarToken
> = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarToken
      {...args}
      backgroundColor={BackgroundColor.goerli}
      borderColor={BorderColor.goerli}
      name="G"
      color={TextColor.primaryInverse}
    />
    <AvatarToken
      {...args}
      backgroundColor={BackgroundColor.sepolia}
      borderColor={BorderColor.sepolia}
      name="S"
      color={TextColor.primaryInverse}
    />
  </Box>
);
ColorBackgroundColorAndBorderColor.args = {
  src: '',
};
