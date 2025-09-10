import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonBaseSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Menu } from '../../ui/menu';

export const ProductTour = ({
  className = '',
  prevIcon = undefined,
  title,
  description,
  currentStep = '',
  totalSteps = '',
  arrowPosition = '20px',
  closeMenu,
  anchorElement,
  onClick,
  prevClick = () => undefined,
  productTourDirection = 'ltr',
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
          style={{
            '--arrow-position': arrowPosition,
          }}
        />
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          className="multichain-product-tour-menu__header"
        >
          {prevIcon ? (
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Sm}
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
          <Button
            isInverse
            variant={ButtonVariant.Primary}
            size={ButtonBaseSize.Sm}
            data-testid="tour-cta-button"
            onClick={onClick}
          >
            {t('gotIt')}
          </Button>
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
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Current step in the product tour
   */
  currentStep: PropTypes.string,
  /**
   * Total steps in the product tour
   */
  totalSteps: PropTypes.string,
  /**
   * Arrow position from left edge (e.g., '20px', '50%')
   */
  arrowPosition: PropTypes.string,
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
