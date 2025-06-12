import React, { useCallback } from 'react';
import {
  Box,
  ButtonIcon,
  IconName,
  ButtonIconSize,
} from '../../../../component-library';
import {
  BorderRadius,
  AlignItems,
  Display,
  JustifyContent,
  BorderColor,
} from '../../../../../helpers/constants/design-system';
import { NetworkFilterDropdownItem } from './network-filter-drop-down-item';

type NetworkFilterDropdownProps = {
  title: string;
  buttonDataTestId: string;
  isCurrentNetwork: boolean;
  openListNetwork: () => void;
  currentNetworkImageUrl: string;
  allOpts: Record<string, boolean>;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
};

export const NetworkFilterDropdown = ({
  title,
  buttonDataTestId,
  isCurrentNetwork,
  openListNetwork,
  currentNetworkImageUrl,
  allOpts,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
}: NetworkFilterDropdownProps) => {
  const setDropdownOpen = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen, setIsDropdownOpen]);

  return (
    <Box
      className="dropdown-editor__item-dropdown"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      borderRadius={BorderRadius.LG}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      paddingLeft={4}
      paddingRight={2}
      ref={dropdownRef}
    >
      <NetworkFilterDropdownItem
        isCurrentNetwork={isCurrentNetwork}
        openListNetwork={openListNetwork}
        currentNetworkImageUrl={currentNetworkImageUrl}
        allOpts={allOpts}
        setDropdownOpen={setDropdownOpen}
      />
      <ButtonIcon
        marginLeft="auto"
        iconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
        ariaLabel={title}
        size={ButtonIconSize.Sm}
        onClick={setDropdownOpen}
        data-testid={buttonDataTestId}
      />
    </Box>
  );
};

export default NetworkFilterDropdown;
