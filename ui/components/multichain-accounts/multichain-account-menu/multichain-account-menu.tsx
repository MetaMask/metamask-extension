import React, { useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE } from '../../../helpers/constants/routes';
import {
  MenuItemConfig,
  MultichainAccountMenuProps,
} from './multichain-account-menu.types';

export const MultichainAccountMenu = ({
  accountGroupId,
  isRemovable,
}: MultichainAccountMenuProps) => {
  const t = useI18nContext();
  const history = useHistory();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const togglePopover = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setIsPopoverOpen(!isPopoverOpen);
  };

  const menuConfig = useMemo(() => {
    const handleAccountDetailsClick = (mouseEvent: React.MouseEvent) => {
      mouseEvent.stopPropagation();
      const multichainAccountDetailsPageRoute = `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`;
      history.push(multichainAccountDetailsPageRoute);
    };

    const handleAccountRenameClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account rename click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
    };

    const handleAccountAddressesClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account addresses click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
    };

    const handleAccountPinClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account pin click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
    };

    const handleAccountHideClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account hide click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
    };

    const handleAccountRemoveClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account remove click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
    };

    const baseMenuItems: MenuItemConfig[] = [
      {
        textKey: 'accountDetails',
        iconName: IconName.Details,
        onClick: handleAccountDetailsClick,
      },
      {
        textKey: 'rename',
        iconName: IconName.Edit,
        onClick: handleAccountRenameClick,
        disabled: true,
      },
      {
        textKey: 'addresses',
        iconName: IconName.QrCode,
        onClick: handleAccountAddressesClick,
        disabled: true,
      },
      {
        textKey: 'pin',
        iconName: IconName.Pin,
        onClick: handleAccountPinClick,
        disabled: true,
      },
      {
        textKey: 'hide',
        iconName: IconName.EyeSlash,
        onClick: handleAccountHideClick,
        disabled: true,
      },
    ];

    if (isRemovable) {
      baseMenuItems.push({
        textKey: 'remove',
        iconName: IconName.Trash,
        onClick: handleAccountRemoveClick,
        textColor: TextColor.errorDefault,
      });
    }

    return Object.freeze(baseMenuItems);
  }, [accountGroupId, history, isRemovable]);

  const menuItems = useMemo(() => {
    return menuConfig.map((item, index, menuConfigurations) => {
      const isLast = index === menuConfigurations.length - 1;

      return (
        <Box
          key={item.textKey}
          className="multichain-account-menu-item"
          paddingLeft={8}
          paddingRight={4}
          paddingTop={3}
          paddingBottom={3}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          onClick={item.onClick}
          style={{
            width: '250px',
            ...(isLast
              ? {}
              : { borderBottom: '1px solid var(--color-border-muted)' }),
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            opacity: item.disabled ? 0.5 : 1,
          }}
        >
          <Text
            fontWeight={FontWeight.Medium}
            variant={TextVariant.bodyMdMedium}
            color={item.textColor}
          >
            {t(item.textKey)}
          </Text>
          <Icon name={item.iconName} size={IconSize.Md} />
        </Box>
      );
    });
  }, [menuConfig, t]);

  return (
    <>
      <Box
        className="multichain-account-menu-button"
        ref={popoverRef}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundMuted}
        borderRadius={BorderRadius.LG}
        padding={1}
        onClick={togglePopover}
      >
        <Icon
          className="multichain-account-menu-button-icon"
          name={IconName.MoreVertical}
        />
      </Box>
      <Popover
        className="multichain-account-menu-popover"
        isOpen={isPopoverOpen}
        position={PopoverPosition.LeftStart}
        referenceElement={popoverRef.current}
        matchWidth={false}
        borderRadius={BorderRadius.LG}
      >
        {menuItems}
      </Popover>
    </>
  );
};
