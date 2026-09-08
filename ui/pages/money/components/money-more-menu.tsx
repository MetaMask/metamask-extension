import React, { useCallback, useState } from 'react';
import {
  ButtonIcon,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Popover,
  PopoverPosition,
  PopoverRole,
} from '../../../components/component-library';
import VisitSupportDataConsentModal from '../../../components/app/modals/visit-support-data-consent-modal';
import { useBoolean } from '../../../hooks/useBoolean';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MONEY_LANDING_URL } from '../constants/urls';

type MenuOption = {
  key: string;
  icon: IconName;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function MoneyMoreMenu() {
  const t = useI18nContext();
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(
    null,
  );
  const {
    value: isMenuOpen,
    toggle: toggleMenu,
    setFalse: closeMenu,
  } = useBoolean();
  const {
    value: isSupportModalOpen,
    setTrue: openSupportModal,
    setFalse: closeSupportModal,
  } = useBoolean();

  const handleBenefits = useCallback(() => {
    closeMenu();
    global.platform.openTab({ url: MONEY_LANDING_URL });
  }, [closeMenu]);

  const handleContactSupport = useCallback(() => {
    closeMenu();
    openSupportModal();
  }, [closeMenu, openSupportModal]);

  const options: MenuOption[] = [
    {
      key: 'how-it-works',
      icon: IconName.Book,
      label: t('moneyHowItWorks'),
      disabled: true,
    },
    {
      key: 'benefits',
      icon: IconName.Export,
      label: t('moneyBenefits'),
      onClick: handleBenefits,
    },
    {
      key: 'contact-support',
      icon: IconName.Sms,
      label: t('moneyContactSupport'),
      onClick: handleContactSupport,
    },
  ];

  return (
    <div ref={setAnchorElement}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        ariaLabel={t('moneyMoreOptions')}
        onClick={toggleMenu}
        data-testid="money-more-menu-button"
      />
      <Popover
        referenceElement={anchorElement}
        isOpen={isMenuOpen}
        isPortal
        role={PopoverRole.Dialog}
        position={PopoverPosition.BottomEnd}
        preventOverflow
        flip
        padding={0}
        className="min-w-[220px] rounded-lg z-[1050]"
        onClickOutside={closeMenu}
        onPressEscKey={closeMenu}
        data-testid="money-more-menu"
      >
        <div className="flex flex-col py-2">
          {options.map(({ key, icon, label, onClick, disabled }) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={onClick}
              className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-hover active:bg-pressed disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
              data-testid={`money-more-menu-${key}`}
            >
              <Icon
                name={icon}
                size={IconSize.Md}
                color={IconColor.IconDefault}
              />
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {label}
              </Text>
            </button>
          ))}
        </div>
      </Popover>
      {isSupportModalOpen ? (
        <VisitSupportDataConsentModal
          isOpen={isSupportModalOpen}
          onClose={closeSupportModal}
        />
      ) : null}
    </div>
  );
}
