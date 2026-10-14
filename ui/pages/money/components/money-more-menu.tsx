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
import { useNavigate } from 'react-router-dom';
import { MONEY_HOW_IT_WORKS_ROUTE } from '../../../helpers/constants/routes';
import {
  Popover,
  PopoverPosition,
  PopoverRole,
} from '../../../components/component-library';
import VisitSupportDataConsentModal from '../../../components/app/modals/visit-support-data-consent-modal';
import { useBoolean } from '../../../hooks/useBoolean';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMoneyAnalytics } from '../../../hooks/money/useMoneyAnalytics';
import {
  MONEY_URLS,
  MoneyBottomSheetName,
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../constants/money-events';

/**
 * Mobile's `IconName.Export` (outlink). After the Phosphor remap,
 * web `IconName.Export` looks like share, so Benefits uses this glyph
 * directly until the design system restores an outlink asset.
 */
const MONEY_OUTLINK_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="inline-block h-5 w-5 shrink-0 text-icon-default"
    aria-hidden="true"
    data-testid="money-more-menu-benefits-icon"
  >
    <path d="m5 21c-.55 0-1.02083-.1958-1.4125-.5875s-.5875-.8625-.5875-1.4125v-14c0-.55.19583-1.02083.5875-1.4125s.8625-.5875 1.4125-.5875h7v2h-7v14h14v-7h2v7c0 .55-.1958 1.0208-.5875 1.4125s-.8625.5875-1.4125.5875zm4.7-5.3-1.4-1.4 9.3-9.3h-3.6v-2h7v7h-2v-3.6z" />
  </svg>
);

type MenuOption = {
  key: string;
  icon: IconName | React.ReactElement;
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
  const { trackButtonClicked } = useMoneyAnalytics({
    screenName: MoneyScreenName.MoneyHome,
  });
  const { trackBottomSheetViewed, trackSurfaceClicked } = useMoneyAnalytics({
    bottomSheetName: MoneyBottomSheetName.MoreSheet,
  });
  const navigate = useNavigate();

  const handleToggleMenu = useCallback(() => {
    if (!isMenuOpen) {
      trackButtonClicked({
        buttonType: MoneyButtonType.Icon,
        buttonIntent: MoneyButtonIntent.OpenMoreMenu,
        componentName: MoneyComponentName.More,
        redirectTarget: MoneyBottomSheetName.MoreSheet,
      });
      trackBottomSheetViewed();
    }
    toggleMenu();
  }, [isMenuOpen, toggleMenu, trackBottomSheetViewed, trackButtonClicked]);

  const handleBenefits = useCallback(() => {
    trackSurfaceClicked({
      componentName: MoneyComponentName.MoreSheetWhatYouGet,
      redirectTarget: MONEY_URLS.MONEY_LANDING,
    });
    closeMenu();
    global.platform.openTab({ url: MONEY_URLS.MONEY_LANDING });
  }, [closeMenu, trackSurfaceClicked]);

  const handleContactSupport = useCallback(() => {
    trackSurfaceClicked({
      componentName: MoneyComponentName.MoreSheetContactSupport,
      redirectTarget: MONEY_URLS.METAMASK_SUPPORT,
    });
    closeMenu();
    openSupportModal();
  }, [closeMenu, openSupportModal, trackSurfaceClicked]);

  const navigateToHowItWorks = useCallback(() => {
    trackSurfaceClicked({
      componentName: MoneyComponentName.MoreSheetHowItWorks,
      redirectTarget: MoneyScreenName.MoneyHowItWorks,
    });
    closeMenu();
    navigate(MONEY_HOW_IT_WORKS_ROUTE);
  }, [closeMenu, navigate, trackSurfaceClicked]);

  const options: MenuOption[] = [
    {
      key: 'how-it-works',
      icon: IconName.Book,
      label: t('moneyHowItWorks'),
      onClick: navigateToHowItWorks,
    },
    {
      key: 'benefits',
      icon: MONEY_OUTLINK_ICON,
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
        onClick={handleToggleMenu}
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
              {React.isValidElement(icon) ? (
                icon
              ) : (
                <Icon
                  name={icon as IconName}
                  size={IconSize.Md}
                  color={IconColor.IconDefault}
                />
              )}
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
