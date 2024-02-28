import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonBase,
  ButtonIcon,
  IconName,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Menu } from '../../ui/menu';

export const ProductTour = ({
  className,
  prevIcon,
  title,
  description,
  currentStep,
  totalSteps,
  positionObj = '5%',
  closeMenu,
  anchorElement,
  onClick,
  prevClick,
  productTourDirection,
  ...props
}) => {
  const t = useI18nContext();
  return (
    <Menu
      className={classnames(
        'multichain-product-tour-menu',
        {
          'multichain-product-tour-menu--rtl': productTourDirection === 'rtl',
        },
        className,
      )}
      anchorElement={anchorElement}
      onHide={closeMenu}
      data-testid="multichain-product-tour-menu-popover"
      {...props}
    >
      <Box
        className="multichain-product-tour-menu__container"
        backgroundColor={BackgroundColor.infoDefault}
        borderRadius={BorderRadius.LG}
        padding={4}
      >
        <Box
          borderWidth={1}
          className="multichain-product-tour-menu__arrow"
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          style={{ right: positionObj }}
        />
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          className="multichain-product-tour-menu__header"
        >
          {prevIcon ? (
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              size={Size.SM}
              color={IconColor.infoInverse}
              onClick={prevClick}
              className="multichain-product-tour-menu__previous-icon"
              data-testid="multichain-product-tour-menu-popover-prevIcon"
            />
          ) : null}
          <Text
            textAlign={TextAlign.Center}
            variant={TextVariant.headingSm}
            width={BlockSize.Full}
            color={TextColor.infoInverse}
          >
            {title}
          </Text>
        </Box>
        <Text
          paddingBottom={2}
          paddingTop={2}
          color={TextColor.infoInverse}
          variant={TextVariant.bodyMd}
        >
          {description}
        </Text>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text
            paddingBottom={2}
            paddingTop={2}
            color={TextColor.infoInverse}
            variant={TextVariant.bodyMd}
            data-testid="multichain-product-tour-menu-popover-step-counter"
          >
            {currentStep && totalSteps
              ? `${currentStep} / ${totalSteps}`
              : null}
          </Text>
          <ButtonBase
            backgroundColor={BackgroundColor.primaryInverse}
            color={TextColor.primaryDefault}
            className="multichain-product-tour-menu__button"
            onClick={onClick}
          >
            {t('recoveryPhraseReminderConfirm')}
          </ButtonBase>
        </Box>
      </Box>
    </Menu>
  );
};

ProductTour.propTypes = {
  /**
   * The element that the menu should display next to
   */
  anchorElement: PropTypes.instanceOf(window.Element),
  /**
   * Function that closes this menu
   */
  closeMenu: PropTypes.func.isRequired,
  /**
   * Additional classNames to be added
   */
  className: PropTypes.string,
  /**
   * Boolean to decide whether to show prevIcon or not
   */
  prevIcon: PropTypes.bool,
  /**
   * Title of the popover
   */
  title: PropTypes.string,
  /**
   * Description of the popover
   */
  description: PropTypes.string,
  /**
   * Current step in the product tour
   */
  currentStep: PropTypes.string,
  /**
   * Total steps in the product tour
   */
  totalSteps: PropTypes.string,
  /**
   * PositionObj to decide the position of the popover tip
   */
  positionObj: PropTypes.string,
  /**
   * The onClick handler to be passed
   */
  onClick: PropTypes.func,
  /**
   * The handler to be passed to prevIcon
   */
  prevClick: PropTypes.func,
  /**
   * Direction to determine the css for menu component
   */
  productTourDirection: PropTypes.string,
};
