import {
  AvatarAccount,
  AvatarAccountVariant,
  AvatarBaseShape,
  AvatarToken,
  AvatarTokenSize,
  BadgeCount,
  BadgeWrapper,
  BadgeNetwork,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxFlexWrap,
  BoxJustifyContent,
  Button,
  ButtonBase,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconName,
  IconColor,
  Text,
  TextButton,
  TextColor,
  TextVariant,
  BadgeWrapperPosition,
  BadgeStatus,
  BadgeStatusStatus,
  IconSize,
} from '@metamask/design-system-react';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Design System/Example Screen',
  component: () => null,
  // Remove default padding
  decorators: [
    (Story) => (
      <Box className="-m-8">
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const WalletHome: React.FC = () => {
  return (
    <Box className="min-h-screen md:flex md:items-center md:justify-center md:bg-alternative md:py-4">
      {/* Container Expanded View */}
      <Box className="mx-auto w-full bg-default md:max-w-xl md:rounded-3xl md:py-4">
        {/* Header */}
        <Box className="border-muted p-4 md:px-8">
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              className="overflow-hidden"
            >
              <AvatarAccount
                shape={AvatarBaseShape.Square}
                variant={AvatarAccountVariant.Maskicon}
                address="0x1234567890123456789012345678901234567890"
              />
              <Text asChild variant={TextVariant.HeadingMd} ellipsis>
                <Box>DeFi Account</Box>
              </Text>
              <ButtonIcon
                iconName={IconName.ArrowDown}
                ariaLabel="Switch Account"
              />
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
            >
              <ButtonIcon iconName={IconName.Copy} ariaLabel="Copy" />
              <ButtonIcon iconName={IconName.Global} ariaLabel="Network" />
              <BadgeWrapper
                badge={<BadgeCount count={10} max={9} />}
                position={BadgeWrapperPosition.TopRight}
              >
                <ButtonIcon iconName={IconName.Menu} ariaLabel="Menu" />
              </BadgeWrapper>
            </Box>
          </Box>
        </Box>
        {/* Balance */}
        <Box className="p-4 md:px-8">
          <Text variant={TextVariant.DisplayMd}>$10,528.46</Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
          >
            <Icon name={IconName.Arrow2Up} color={IconColor.SuccessDefault} />
            <Text color={TextColor.TextAlternative}>$367.00 (+0.66%)</Text>
          </Box>
        </Box>
        {/* Actions */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          flexWrap={BoxFlexWrap.Wrap}
          gap={2}
          className="p-4 md:px-8"
        >
          <ButtonBase className="h-auto flex-1 flex-col justify-center rounded-lg bg-muted py-4 hover:bg-muted-hover active:bg-muted-pressed">
            <Icon name={IconName.Bank} className="mb-2" />
            Buy/Sell
          </ButtonBase>
          <ButtonBase className="h-auto flex-1 flex-col justify-center rounded-lg bg-muted py-4 hover:bg-muted-hover active:bg-muted-pressed">
            <Icon name={IconName.SwapHorizontal} className="mb-2" />
            Swap
          </ButtonBase>
          <ButtonBase className="h-auto flex-1 flex-col justify-center rounded-lg bg-muted py-4 hover:bg-muted-hover active:bg-muted-pressed">
            <Icon name={IconName.Receive} className="mb-2" />
            Receive
          </ButtonBase>
          <ButtonBase className="h-auto flex-1 flex-col justify-center rounded-lg bg-muted py-4 hover:bg-muted-hover active:bg-muted-pressed">
            <Icon name={IconName.Send} className="mb-2" />
            Send
          </ButtonBase>
        </Box>
        {/* Tabs */}
        <Box className="border-b border-muted px-4 md:px-8">
          <Box flexDirection={BoxFlexDirection.Row}>
            <Text
              asChild
              fontWeight={FontWeight.Medium}
              className="flex-1 border-b-2 border-default pb-2 pt-1"
            >
              <button>Tokens</button>
            </Text>
            <Text
              asChild
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
              className="flex flex-1 items-center justify-center gap-1 pb-2 pt-1 hover:text-default"
            >
              <button>
                <span className="pl-4">DeFi</span>
                <BadgeStatus status={BadgeStatusStatus.New}>New</BadgeStatus>
              </button>
            </Text>
            <Text
              asChild
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
              className="flex-1 pb-2 pt-1 hover:text-default"
            >
              <button>NFTs</button>
            </Text>
            <Text
              asChild
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
              className="flex-1 pb-2 pt-1 hover:text-default"
            >
              <button>Activity</button>
            </Text>
          </Box>
        </Box>
        {/* Token List */}
        <Box>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            className="p-4 md:px-8"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
            >
              <Button
                size={ButtonSize.Sm}
                variant={ButtonVariant.Secondary}
                endIconName={IconName.ArrowDown}
              >
                Popular networks
              </Button>
            </Box>
            <Box flexDirection={BoxFlexDirection.Row} gap={2}>
              <ButtonIcon iconName={IconName.Filter} ariaLabel="Filter" />
              <ButtonIcon iconName={IconName.MoreVertical} ariaLabel="More" />
            </Box>
          </Box>

          {/* Ethereum */}
          <Box
            tabIndex={0}
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            className="w-full bg-transparent px-4 py-2 hover:bg-hover active:bg-pressed md:px-8"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={4}
              className="overflow-hidden"
            >
              <BadgeWrapper
                badge={
                  <BadgeNetwork
                    name="Ethereum"
                    src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                  />
                }
              >
                <AvatarToken
                  name="ETH"
                  src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                  size={AvatarTokenSize.Md}
                />
              </BadgeWrapper>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="overflow-hidden"
              >
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  flexWrap={BoxFlexWrap.Wrap}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    fontWeight={FontWeight.Medium}
                    ellipsis
                    className="mr-2 truncate"
                  >
                    Ethereum •
                  </Text>
                  <TextButton
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent parent div click
                      /* Handle earn button click */
                    }}
                    className="min-w-0"
                  >
                    Earn
                  </TextButton>
                </Box>
                <Text
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodySm}
                  className="flex items-center"
                >
                  <Icon
                    name={IconName.Arrow2Up}
                    color={IconColor.SuccessDefault}
                    size={IconSize.Sm}
                  />
                  <span>+85.88%</span>
                </Text>
              </Box>
            </Box>
            <Box className="text-right">
              <Text>$8,509.44</Text>
              <Text
                color={TextColor.TextAlternative}
                variant={TextVariant.BodySm}
              >
                0.7107 ETH
              </Text>
            </Box>
          </Box>

          {/* Unibright */}
          <Box
            tabIndex={0}
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            className="w-full bg-transparent px-4 py-2 hover:bg-hover active:bg-pressed md:px-8"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={4}
              className="overflow-hidden"
            >
              <BadgeWrapper
                badge={
                  <BadgeNetwork
                    name="Ethereum"
                    src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                  />
                }
              >
                <AvatarToken
                  name="UBT"
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/2758.png"
                  size={AvatarTokenSize.Md}
                />
              </BadgeWrapper>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="overflow-hidden"
              >
                <Text fontWeight={FontWeight.Medium} ellipsis>
                  Unibright
                </Text>
                <Text
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodySm}
                  className="flex items-center"
                >
                  <Icon
                    name={IconName.Arrow2Up}
                    color={IconColor.SuccessDefault}
                    size={IconSize.Sm}
                  />
                  <span>+85.88%</span>
                </Text>
              </Box>
            </Box>
            <Box className="text-right">
              <Text>$1,293.50</Text>
              <Text
                color={TextColor.TextAlternative}
                variant={TextVariant.BodySm}
              >
                0.058 UBT
              </Text>
            </Box>
          </Box>

          {/* Hopr */}
          <Box
            tabIndex={0}
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            className="w-full bg-transparent px-4 py-2 hover:bg-hover active:bg-pressed md:px-8"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={4}
              className="overflow-hidden"
            >
              <BadgeWrapper
                badge={
                  <BadgeNetwork
                    name="Ethereum"
                    src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                  />
                }
              >
                <AvatarToken
                  name="HOPR"
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/6520.png"
                  size={AvatarTokenSize.Md}
                />
              </BadgeWrapper>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="overflow-hidden"
              >
                <Text fontWeight={FontWeight.Medium} ellipsis>
                  Hopr
                </Text>
                <Text
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodySm}
                  className="flex items-center"
                >
                  <Icon
                    name={IconName.Arrow2Up}
                    color={IconColor.SuccessDefault}
                    size={IconSize.Sm}
                  />
                  <span>+85.88%</span>
                </Text>
              </Box>
            </Box>
            <Box className="text-right">
              <Text>$550.00</Text>
              <Text
                color={TextColor.TextAlternative}
                variant={TextVariant.BodySm}
              >
                12.44 HOPR
              </Text>
            </Box>
          </Box>

          {/* USDC */}
          <Box
            tabIndex={0}
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            className="w-full bg-transparent px-4 py-2 hover:bg-hover active:bg-pressed md:px-8"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={4}
              className="overflow-hidden"
            >
              <BadgeWrapper
                badge={
                  <BadgeNetwork
                    name="Ethereum"
                    src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                  />
                }
              >
                <AvatarToken
                  name="USDC"
                  src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
                  size={AvatarTokenSize.Md}
                />
              </BadgeWrapper>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="overflow-hidden"
              >
                <Text fontWeight={FontWeight.Medium} ellipsis>
                  USDC Coin
                </Text>
                <Text
                  color={TextColor.TextAlternative}
                  variant={TextVariant.BodySm}
                  className="flex items-center"
                >
                  <Icon
                    name={IconName.Arrow2Down}
                    color={IconColor.ErrorDefault}
                    size={IconSize.Sm}
                  />
                  <span>-7.80%</span>
                </Text>
              </Box>
            </Box>
            <Box className="text-right">
              <Text>$110.20</Text>
              <Text
                color={TextColor.TextAlternative}
                variant={TextVariant.BodySm}
              >
                0.7107 USDC
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const Default: Story = {
  render: () => <WalletHome />,
};
