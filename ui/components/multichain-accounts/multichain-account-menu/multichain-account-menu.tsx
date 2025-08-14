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
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
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
      setIsPopoverOpen(false);
      history.push(ACCOUNT_LIST_PAGE_ROUTE);
    };

    const handleAccountAddressesClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account addresses click handling
      mouseEvent.stopPropagation();
      setIsPopoverOpen(false);
      history.push(ACCOUNT_LIST_PAGE_ROUTE);
    };

    const handleAccountPinClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account pin click handling
      mouseEvent.stopPropagation();
      setIsPopoverOpen(false);
      history.push(ACCOUNT_LIST_PAGE_ROUTE);
    };

    const handleAccountHideClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account hide click handling
      mouseEvent.stopPropagation();
      setIsPopoverOpen(false);
      history.push(ACCOUNT_LIST_PAGE_ROUTE);
    };

    const handleAccountRemoveClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account remove click handling
      mouseEvent.stopPropagation();
      setIsPopoverOpen(false);
      history.push(ACCOUNT_LIST_PAGE_ROUTE);
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
      },
      {
        textKey: 'addresses',
        iconName: IconName.QrCode,
        onClick: handleAccountAddressesClick,
      },
      {
        textKey: 'pin',
        iconName: IconName.Pin,
        onClick: handleAccountPinClick,
      },
      {
        textKey: 'hide',
        iconName: IconName.EyeSlash,
        onClick: handleAccountHideClick,
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
            cursor: 'pointer',
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
        ref={popoverRef}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundMuted}
        borderRadius={BorderRadius.LG}
        padding={1}
        onClick={togglePopover}
        style={{ cursor: 'pointer', width: '28px', height: '28px' }}
      >
        <Icon name={IconName.MoreVertical} />
      </Box>
      <Popover
        isOpen={isPopoverOpen}
        position={PopoverPosition.LeftStart}
        referenceElement={popoverRef.current}
        matchWidth={false}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        borderRadius={BorderRadius.LG}
      >
        {menuItems}
      </Popover>
    </>
  );
};

export default MultichainAccountMenu;
