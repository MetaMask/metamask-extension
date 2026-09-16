import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextButton,
  TextVariant,
} from '@metamask/design-system-react';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import {
  ONBOARDING_ROUTE,
  PRIVACY_ROUTE,
} from '../../../helpers/constants/routes';
import { getIsBasicFunctionalitySocialLoginUser } from '../../../selectors/onboarding';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getShouldShowBasicFunctionalityMigrationModal } from '../../../selectors/multichain/feature-flags';
import { acknowledgeBasicFunctionalityMigration } from '../../../store/actions';
import { useAppSelector, useDispatch } from '../../../store/hooks';
import {
  BASIC_FUNCTIONALITY_MIGRATION_BLOG_POST_LINK,
  BASIC_FUNCTIONALITY_MIGRATION_PRIVACY_NOTICE_LINK,
} from './constants';

const linkClassName =
  '!text-inherit !font-normal underline underline-offset-2 [text-decoration-skip-ink:none] cursor-pointer hover:!text-inherit hover:!font-normal hover:![text-decoration-color:inherit] hover:!underline-offset-2 hover:!cursor-pointer';

export function BasicFunctionalityMigrationModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isOpen = useAppSelector(getShouldShowBasicFunctionalityMigrationModal);

  const isUnlocked = useAppSelector(getIsUnlocked);
  const completedOnboarding = useAppSelector(getCompletedOnboarding);
  const isSocialLogin = useAppSelector(getIsBasicFunctionalitySocialLoginUser);
  const { pathname } = useLocation();

  // Error pages replace the routes tree, so this modal is unmounted there.
  if (
    !isOpen ||
    !isUnlocked ||
    !completedOnboarding ||
    pathname === ONBOARDING_ROUTE ||
    pathname.startsWith(`${ONBOARDING_ROUTE}/`) ||
    pathname.replace(/\/$/u, '') === PRIVACY_ROUTE
  ) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      data-testid="basic-functionality-migration-modal"
    >
      <ModalOverlay />
      <ModalContent
        className="items-center"
        modalDialogProps={{
          flexDirection: BoxFlexDirection.Column,
        }}
      >
        <ModalHeader>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Icon name={IconName.ShieldLock} size={IconSize.Xl} />
            <Text variant={TextVariant.HeadingSm}>
              {t('basicFunctionalityMigrationSocialModalTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <Box
          marginHorizontal={4}
          marginBottom={3}
          flexDirection={BoxFlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.BodyMd}>
            {t(
              isSocialLogin
                ? 'basicFunctionalityMigrationSocialModalBody1'
                : 'basicFunctionalityMigrationModalBody',
            )}
          </Text>
          <Text variant={TextVariant.BodyMd}>
            {t('basicFunctionalityMigrationSocialModalBody2', [
              <TextButton
                asChild
                key="basic-functionality-migration-blog-post"
                className={linkClassName}
              >
                <a
                  href={BASIC_FUNCTIONALITY_MIGRATION_BLOG_POST_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('basicFunctionalityMigrationSocialModalBlogPostLink')}
                </a>
              </TextButton>,
              <TextButton
                asChild
                key="basic-functionality-migration-privacy-notice"
                className={linkClassName}
              >
                <a
                  href={BASIC_FUNCTIONALITY_MIGRATION_PRIVACY_NOTICE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('basicFunctionalityMigrationSocialModalPrivacyNoticeLink')}
                </a>
              </TextButton>,
            ])}
          </Text>
          <TextButton asChild className={linkClassName}>
            <Link to={PRIVACY_ROUTE}>
              {t('basicFunctionalityMigrationToastSettingsLink')}
            </Link>
          </TextButton>
        </Box>
        <ModalFooter>
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            onClick={() => dispatch(acknowledgeBasicFunctionalityMigration())}
            data-testid="basic-functionality-migration-modal-accept"
          >
            {t('basicFunctionalityMigrationAcknowledge')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
