import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  BLOCK_SIZES,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarToken,
  AvatarWithBadge,
  AVATAR_WITH_BADGE_POSTIONS,
  Text,
} from '../../component-library';
import Box from '../../ui/box/box';
import { getNativeCurrencyImage } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const MultichainTokenListItem = ({
  className,
  onClick,
  tokenSymbol,
  tokenImage,
  primary,
  secondary,
}) => {
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const t = useI18nContext();
  return (
    <Box
      className={classnames('multichain-token-list-item', className)}
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      gap={4}
      data-testid="multichain-token-list-item"
      width={[
        BLOCK_SIZES.ONE_FIFTH,
        BLOCK_SIZES.HALF,
        BLOCK_SIZES.ONE_THIRD,
      ]}
    >
      <Box
        className="multichain-token-list-item__container-cell"
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        padding={4}
        as="a"
        data-testid="multichain-token-list-button"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        <AvatarWithBadge
          badgePosition={AVATAR_WITH_BADGE_POSTIONS.TOP}
          badge={
            <AvatarNetwork
              size={Size.XS}
              name={t('networkNameEthereum')}
              src={primaryTokenImage}
            />
          }
          marginRight={3}
        >
          <AvatarToken name={tokenSymbol} src={tokenImage} showHalo />
        </AvatarWithBadge>
        <Box
          className="multichain-token-list-item__container-cell--text-container"
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text fontWeight={FONT_WEIGHT.MEDIUM} variant={TextVariant.bodyMd}>
              {tokenSymbol}
            </Text>
            <Text fontWeight={FONT_WEIGHT.MEDIUM} variant={TextVariant.bodyMd}>
              {secondary}
            </Text>
          </Box>
          <Text color={TextColor.textAlternative}>
            {primary} {tokenSymbol}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

MultichainTokenListItem.propTypes = {
  /**
   * An additional className to apply to the TokenList.
   */

  className: PropTypes.string,
  /**
   * The onClick handler to be passed to the MultichainTokenListItem component
   */
  onClick: PropTypes.func,
  /**
   * tokenSymbol represents the symbol of the Token
   */
  tokenSymbol: PropTypes.string,
  /**
   * tokenImage represnts the image of the token icon
   */
  tokenImage: PropTypes.string,
  /**
   * primary represents the balance
   */
  primary: PropTypes.string,
  /**
   * secondary represents the balance in dollars
   */
  secondary: PropTypes.string,
};
