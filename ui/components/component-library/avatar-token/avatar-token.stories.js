import React from 'react';
import {
  Size,
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

import README from './README.mdx';

import { AvatarToken } from './avatar-token';
import { AVATAR_TOKEN_SIZES } from './avatar-token.constants';

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
      options: Object.values(AVATAR_TOKEN_SIZES),
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
    size: Size.MD,
    showHalo: false,
  },
};

const Template = (args) => {
  return <AvatarToken {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.baseline}
      gap={2}
      marginBottom={4}
    >
      <AvatarToken {...args} size={Size.XS} />
      <AvatarToken {...args} size={Size.SM} />
      <AvatarToken {...args} size={Size.MD} />
      <AvatarToken {...args} size={Size.LG} />
      <AvatarToken {...args} size={Size.XL} />
    </Box>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexEnd}
      gap={2}
      marginBottom={4}
    >
      <AvatarToken {...args} src="" size={Size.XS} />
      <AvatarToken {...args} src="" size={Size.SM} />
      <AvatarToken {...args} src="" size={Size.MD} />
      <AvatarToken {...args} src="" size={Size.LG} />
      <AvatarToken {...args} src="" size={Size.XL} />
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
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={Size.XS} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={Size.SM} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={Size.MD} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={Size.LG} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.png"
            name="ETH"
            size={Size.SM}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={Size.XL} />
      </BadgeWrapper>
    </Box>
    <Box display={DISPLAY.FLEX} alignItems={AlignItems.flexEnd} gap={2}>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          src=""
          name="ETH"
          size={Size.XS}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={Size.SM}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={Size.MD}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={Size.XS}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={Size.LG}
          borderColor={BorderColor.borderDefault}
          borderSize={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={Size.SM}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={Size.XL}
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

export const Src = (args) => (
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

export const ColorBackgroundColorAndBorderColor = (args) => (
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
