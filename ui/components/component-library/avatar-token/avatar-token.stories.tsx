import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Display,
  AlignItems,
  TextColor,
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '..';
import README from './README.mdx';
import { AvatarToken, AvatarTokenSize } from '.';

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
      options: Object.values(AvatarTokenSize),
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
    src: './images/eth_logo.svg',
    size: AvatarTokenSize.Md,
    showHalo: false,
  },
} as Meta<typeof AvatarToken>;

const Template: StoryFn<typeof AvatarToken> = (args) => {
  return <AvatarToken {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory: StoryFn<typeof AvatarToken> = (args) => (
  <>
    <Box
      display={Display.Flex}
      alignItems={AlignItems.baseline}
      gap={2}
      marginBottom={4}
    >
      <AvatarToken {...args} size={AvatarTokenSize.Xs} />
      <AvatarToken {...args} size={AvatarTokenSize.Sm} />
      <AvatarToken {...args} size={AvatarTokenSize.Md} />
      <AvatarToken {...args} size={AvatarTokenSize.Lg} />
      <AvatarToken {...args} size={AvatarTokenSize.Xl} />
    </Box>
    <Box
      display={Display.Flex}
      alignItems={AlignItems.flexEnd}
      gap={2}
      marginBottom={4}
    >
      <AvatarToken {...args} src="" size={AvatarTokenSize.Xs} />
      <AvatarToken {...args} src="" size={AvatarTokenSize.Sm} />
      <AvatarToken {...args} src="" size={AvatarTokenSize.Md} />
      <AvatarToken {...args} src="" size={AvatarTokenSize.Lg} />
      <AvatarToken {...args} src="" size={AvatarTokenSize.Xl} />
    </Box>
    <Text marginBottom={4}>
      Sizes with{' '}
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        href="/docs/components-componentlibrary-buttonlink--default-story"
      >
        AvatarNetwork
      </ButtonLink>{' '}
      and{' '}
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        href="/docs/components-componentlibrary-badgewrapper--default-story"
      >
        BadgeWrapper
      </ButtonLink>{' '}
      components
    </Text>
    <Box
      display={Display.Flex}
      alignItems={AlignItems.flexEnd}
      gap={2}
      marginBottom={4}
    >
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.svg"
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarTokenSize.Xs} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.svg"
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarTokenSize.Sm} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.svg"
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarTokenSize.Md} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.svg"
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarTokenSize.Lg} />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            src="./images/eth_logo.svg"
            name="ETH"
            size={AvatarNetworkSize.Sm}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken {...args} name="ETH" size={AvatarTokenSize.Xl} />
      </BadgeWrapper>
    </Box>
    <Box display={Display.Flex} alignItems={AlignItems.flexEnd} gap={2}>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          src=""
          name="ETH"
          size={AvatarTokenSize.Xs}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarTokenSize.Sm}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarTokenSize.Md}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarNetworkSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarTokenSize.Lg}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
        />
      </BadgeWrapper>
      <BadgeWrapper
        badge={
          <AvatarNetwork
            name="ETH"
            size={AvatarNetworkSize.Sm}
            borderColor={BorderColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          {...args}
          name="ETH"
          src=""
          size={AvatarTokenSize.Xl}
          borderColor={BorderColor.borderDefault}
          borderWidth={2}
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

export const Src: StoryFn<typeof AvatarToken> = (args) => (
  <Box display={Display.Flex} gap={1}>
    <AvatarToken {...args} src="./images/eth_logo.svg" />
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

export const ColorBackgroundColorAndBorderColor: StoryFn<typeof AvatarToken> = (
  args,
) => (
  <Box display={Display.Flex} gap={1}>
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
