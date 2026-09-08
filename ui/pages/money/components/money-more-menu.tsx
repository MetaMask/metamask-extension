import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import VisitSupportDataConsentModal from '../../../components/app/modals/visit-support-data-consent-modal';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { MONEY_HOW_IT_WORKS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MONEY_LANDING_URL } from '../constants/urls';

export type MoneyMoreMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

type MenuOption = {
  labelKey: string;
  icon: IconName;
  testId: string;
  onPress: () => void;
};

/**
 * "More" option sheet opened from the Money home kebab menu. Ported from
 * mobile's MoneyMoreSheet.
 *
 * @param props - Component props.
 * @param props.isOpen - Whether the sheet is visible.
 * @param props.onClose - Called when the sheet should close.
 * @returns The More menu modal.
 */
export function MoneyMoreMenu({ isOpen, onClose }: MoneyMoreMenuProps) {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [isSupportConsentOpen, setIsSupportConsentOpen] = useState(false);

  const environmentType = getEnvironmentType();
  const isCompactSheet =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const modalLayoutProps = useMemo(
    () =>
      isCompactSheet
        ? {
            contentClassName: 'flex items-stretch justify-end p-0',
            dialogStyle: {
              marginTop: 'auto',
              width: '100%',
              maxWidth: '100%',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
            },
          }
        : {
            contentClassName: 'flex items-center justify-center p-0',
            dialogStyle: {
              width: '100%',
              maxWidth: '360px',
              borderRadius: '20px',
            },
          },
    [isCompactSheet],
  );

  const handleHowItWorks = useCallback(() => {
    onClose();
    navigate(MONEY_HOW_IT_WORKS_ROUTE);
  }, [navigate, onClose]);

  const handleBenefits = useCallback(() => {
    onClose();
    global.platform.openTab({ url: MONEY_LANDING_URL });
  }, [onClose]);

  const handleContactSupport = useCallback(() => {
    setIsSupportConsentOpen(true);
  }, []);

  const handleSupportConsentClose = useCallback(() => {
    setIsSupportConsentOpen(false);
  }, []);

  const options: MenuOption[] = [
    {
      labelKey: 'moneyHowItWorks',
      icon: IconName.Book,
      testId: 'money-more-menu-how-it-works',
      onPress: handleHowItWorks,
    },
    {
      labelKey: 'moneyBenefits',
      icon: IconName.Export,
      testId: 'money-more-menu-benefits',
      onPress: handleBenefits,
    },
    {
      labelKey: 'moneyContactSupport',
      icon: IconName.Sms,
      testId: 'money-more-menu-contact-support',
      onPress: handleContactSupport,
    },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} data-testid="money-more-menu">
        <ModalOverlay />
        <ModalContent
          size={ModalContentSize.Sm}
          className={modalLayoutProps.contentClassName}
          modalDialogProps={{
            padding: 0,
            style: modalLayoutProps.dialogStyle,
          }}
        >
          <ModalHeader
            onClose={onClose}
            closeButtonProps={{ ariaLabel: t('close') }}
          >
            {t('moneyMoreSheetTitle')}
          </ModalHeader>
          <ModalBody className="!p-0">
            <Box flexDirection={BoxFlexDirection.Column} className="w-full">
              {options.map((option) => (
                <ButtonBase
                  key={option.testId}
                  onClick={option.onPress}
                  className="h-[46px] w-full min-w-0 justify-start gap-3 rounded-none px-4 text-left hover:bg-hover active:bg-pressed"
                  data-testid={option.testId}
                >
                  <Icon
                    name={option.icon}
                    size={IconSize.Lg}
                    color={IconColor.IconDefault}
                  />
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    {t(option.labelKey)}
                  </Text>
                </ButtonBase>
              ))}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
      <VisitSupportDataConsentModal
        isOpen={isSupportConsentOpen}
        onClose={handleSupportConsentClose}
      />
    </>
  );
}
