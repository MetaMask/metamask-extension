import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  BLOCK_SIZES,
  BorderColor,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarToken,
  BadgeWrapper,
  Text,
} from '../../component-library';
import Box from '../../ui/box/box';
import { getNativeCurrencyImage } from '../../../selectors';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const MultichainTokenListItem = ({
  className,
  onClick,
  tokenSymbol,
  tokenImage,
  primary,
  secondary,
  title,
}) => {
  const t = useI18nContext();
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const dataTheme = document.documentElement.getAttribute('data-theme');
  return (
    <Box
      className={classnames('multichain-token-list-item', className)}
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      gap={4}
      data-testid="multichain-token-list-item"
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
        <BadgeWrapper
          badge={
            <AvatarNetwork
              size={Size.XS}
              name={tokenSymbol}
              src={primaryTokenImage}
              borderColor={
                primaryTokenImage
                  ? BorderColor.borderMuted
                  : BorderColor.borderDefault
              }
            />
          }
          marginRight={3}
        >
          <AvatarToken
            name={tokenSymbol}
            src={tokenImage}
            showHalo
            borderColor={
              tokenImage ? BorderColor.transparent : BorderColor.borderDefault
            }
          />
        </BadgeWrapper>
        <Box
          className="multichain-token-list-item__container-cell--text-container"
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
          width={BLOCK_SIZES.FULL}
          style={{ flexGrow: 1, overflow: 'hidden' }}
        >
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            gap={1}
          >
            <Box width={[BLOCK_SIZES.ONE_THIRD]}>
              <Tooltip
                position="bottom"
                interactive
                html={title}
                disabled={title?.length < 12}
                tooltipInnerClassName="multichain-token-list-item__tooltip"
                theme={dataTheme === 'light' ? 'dark' : 'light'}
              >
                <Text
                  fontWeight={FONT_WEIGHT.MEDIUM}
                  variant={TextVariant.bodyMd}
                  ellipsis
                >
                  {title === 'ETH' ? t('networkNameEthereum') : title}
                </Text>
              </Tooltip>
            </Box>
            <Text
              fontWeight={FONT_WEIGHT.MEDIUM}
              variant={TextVariant.bodyMd}
              width={[BLOCK_SIZES.TWO_THIRD]}
              textAlign={TEXT_ALIGN.END}
            >
              {secondary}
            </Text>
          </Box>
          <Text color={TextColor.textAlternative}>
            {Number(primary).toFixed(3)} {tokenSymbol}{' '}
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
   * title represents the name of the token and if name is not available then Symbol
   */
  title: PropTypes.string,
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
