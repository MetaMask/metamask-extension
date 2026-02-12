import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Popover,
  PopoverPosition,
  PopoverRole,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SnapMetadataModal } from '../snap-metadata-modal';

export default function SnapHomeMenu({
  snapId,
  isSettingsAvailable,
  onSettingsClick,
  onRemoveClick,
}) {
  const t = useI18nContext();

  const [menuReferenceElement, setMenuReferenceElement] = useState();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isSnapMetadataModalOpen, setIsSnapMetadataModalOpen] = useState(false);

  const handleMenuClick = (menuItem) => {
    switch (menuItem) {
      case 'settings':
        onSettingsClick();
        break;
      case 'details':
        setIsSnapMetadataModalOpen(true);
        break;
      case 'remove':
        onRemoveClick();
        break;
      default:
        break;
    }
    setIsMenuOpen(false);
  };

  const handleMenuOpen = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const setMenuRef = (ref) => {
    setMenuReferenceElement(ref);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const closeSnapMetadataModal = () => setIsSnapMetadataModalOpen(false);

  return (
    <>
      {isSnapMetadataModalOpen && (
        <SnapMetadataModal
          snapId={snapId}
          isOpen={isSnapMetadataModalOpen}
          onClose={closeSnapMetadataModal}
        />
      )}
      <Box display={Display.Flex}>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <ButtonIcon
            iconName={IconName.MoreVertical}
            data-testid="snap-home-menu-button"
            ariaLabel={t('snapHomeMenu')}
            onClick={() => {
              handleMenuOpen();
            }}
            size={ButtonIconSize.Md}
            ref={setMenuRef}
          />
        </Box>
        <Popover
          referenceElement={menuReferenceElement}
          isOpen={isMenuOpen}
          position={PopoverPosition.BottomEnd}
          role={PopoverRole.Dialog}
          preventOverflow
          padding={0}
          offset={[-12, -2]}
          onClickOutside={closeMenu}
          onPressEscKey={closeMenu}
          style={{
            zIndex: 1,
          }}
        >
          <Box
            display={Display.Flex}
            padding={1}
            flexDirection={FlexDirection.Column}
            className="snap-home-menu"
          >
            {isSettingsAvailable && (
              <Box className="snap-home-menu__item">
                <Text
                  onClick={() => handleMenuClick('settings')}
                  variant={TextVariant.bodyMd}
                  padding={[1, 1, 2, 2]}
                >
                  {t('settings')}
                </Text>
              </Box>
            )}
            <Box className="snap-home-menu__item">
              <Text
                onClick={() => handleMenuClick('details')}
                variant={TextVariant.bodyMd}
                padding={[1, 1, 2, 2]}
              >
                {t('details')}
              </Text>
            </Box>
            <Box className="snap-home-menu__item">
              <Text
                onClick={() => handleMenuClick('remove')}
                variant={TextVariant.bodyMd}
                color={TextColor.errorDefault}
                padding={[1, 1, 2, 2]}
              >
                {t('remove')}
              </Text>
            </Box>
          </Box>
        </Popover>
      </Box>
    </>
  );
}

SnapHomeMenu.propTypes = {
  snapId: PropTypes.string.isRequired,
  isSettingsAvailable: PropTypes.bool.isRequired,
  onSettingsClick: PropTypes.func.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
};
