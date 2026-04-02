import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { setShowPasswordChangeToast } from '../toast-master/utils';
import { getIsSeedlessPasswordOutdated } from '../../../ducks/metamask/metamask';
import { MetaMetricsContext } from '../../../contexts/metametrics';
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
  const { trackEvent } = useContext(MetaMetricsContext);

  useEffect(() => {
    if (isSeedlessPwdOutdated) {
      trackEvent({
        event: MetaMetricsEventName.PasswordOutdatedModalViewed,
        category: MetaMetricsEventCategory.App,
      });
    }
  }, [isSeedlessPwdOutdated, trackEvent]);

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
              await dispatch(setShowPasswordChangeToast(null));
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
