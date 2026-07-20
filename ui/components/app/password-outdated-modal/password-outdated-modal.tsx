import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  IconColor,
  TextAlign,
  TextVariant,
  Box,
  Text,
  ButtonSize,
  Button,
  Icon,
  IconSize,
  IconName,
  BoxJustifyContent,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { toast } from 'react-hot-toast';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { AlignItems } from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { lockMetamask } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PasswordOutdatedModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSeedlessPwdOutdated = useSelector(getIsSeedlessPasswordOutdated);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!isSeedlessPwdOutdated) {
      hasTrackedView.current = false;
      return;
    }

    if (hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasswordOutdatedModalViewed)
        .addCategory(MetaMetricsEventCategory.App)
        .build(),
    );
  }, [createEventBuilder, isSeedlessPwdOutdated, trackEvent]);

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      data-testid="password-outdated-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={4}
          >
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              color={IconColor.WarningDefault}
            />

            <Text variant={TextVariant.HeadingMd} textAlign={TextAlign.Center}>
              {t('passwordChangedRecently')}
            </Text>

            <Text variant={TextVariant.BodySm}>
              {t('passwordChangedRecentlyDescription')}
            </Text>
          </Box>
        </ModalHeader>

        <Box
          paddingLeft={4}
          paddingRight={4}
          marginTop={2}
          gap={4}
          className="w-full"
        >
          <Button
            data-testid="password-changed"
            size={ButtonSize.Lg}
            className="w-full"
            onClick={async () => {
              // remove the password change toast from the app state
              toast.dismiss();
              await dispatch(lockMetamask());
              navigate(DEFAULT_ROUTE);
            }}
          >
            {t('continue')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
