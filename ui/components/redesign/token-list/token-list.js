import React from 'react';
import {
  AlignItems,
  BLOCK_SIZES,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  IconColor,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarToken,
  AvatarWithBadge,
  AVATAR_WITH_BADGE_POSTIONS,
  ButtonLink,
  Icon,
  ICON_NAMES,
  Text,
} from '../../component-library';
import Box from '../../ui/box/box';

export const TokenList = () => {
  return (
    <Box
      className="token-list"
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      gap={4}
      width={BLOCK_SIZES.ONE_THIRD}
    >
      <Box className="token-list__container">
        <Box
          className="token-list__container--cell"
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
        >
          <AvatarWithBadge
            badgePosition={AVATAR_WITH_BADGE_POSTIONS.TOP}
            badge={
              <AvatarNetwork
                size={Size.XS}
                name="Ethereum"
                src="https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg"
              />
            }
            marginRight={3}
          >
            <AvatarToken
              src="https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg"
              showHalo
            />
          </AvatarWithBadge>
          <Box
            className="token-list__container--cell--text-container"
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text
                fontWeight={FONT_WEIGHT.MEDIUM}
                variant={TextVariant.bodyMd}
              >
                Ethereum
              </Text>
              <Text
                fontWeight={FONT_WEIGHT.MEDIUM}
                variant={TextVariant.bodyMd}
              >
                $1,230.13
              </Text>
            </Box>
            <Text color={TextColor.textAlternative}>1.234 ETH</Text>
          </Box>
        </Box>
      </Box>
      <Box className="token-list__container">
        <Box
          className="token-list__container--cell"
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
        >
          <AvatarWithBadge
            badgePosition={AVATAR_WITH_BADGE_POSTIONS.TOP}
            badge={
              <AvatarNetwork
                size={Size.XS}
                name="Ethereum"
                src="https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg"
              />
            }
            marginRight={3}
          >
            <AvatarToken
              src="https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg"
              showHalo
            />
          </AvatarWithBadge>
          <Box
            className="token-list__container--cell--text-container"
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text
                fontWeight={FONT_WEIGHT.MEDIUM}
                variant={TextVariant.bodyMd}
              >
                Ethereum
              </Text>
              <Text
                fontWeight={FONT_WEIGHT.MEDIUM}
                variant={TextVariant.bodyMd}
              >
                $1,230.13
              </Text>
            </Box>
            <Text color={TextColor.textAlternative}>1.234 ETH</Text>
          </Box>
        </Box>
      </Box>
      <Box className="token-list__buttons">
        <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
          <Icon
            name={ICON_NAMES.IMPORT}
            color={IconColor.infoDefault}
            marginRight={2}
          />
          <ButtonLink>Import Token</ButtonLink>
        </Box>
        <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
          <Icon
            name={ICON_NAMES.REFRESH}
            color={IconColor.infoDefault}
            marginRight={2}
          />
          <ButtonLink>Refresh</ButtonLink>
        </Box>
      </Box>
      <Box className="token-list__support-link">
        <Text textAlign={TEXT_ALIGN.CENTER}>
          Need help? <ButtonLink>Contact MetaMask Support</ButtonLink>{' '}
        </Text>
      </Box>
    </Box>
  );
};

TokenList.propTypes = {
  /**
   * TokenList also accepts all props from Box
   */
  ...Box.propTypes,
};
