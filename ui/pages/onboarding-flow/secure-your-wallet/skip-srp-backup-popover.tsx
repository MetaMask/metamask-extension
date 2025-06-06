import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import React, { useCallback, useContext, useState } from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  ButtonSize,
  Checkbox,
  Button,
  ButtonVariant,
  Icon,
  IconSize,
  IconName,
} from '../../../components/component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
// eslint-disable-next-line import/no-restricted-paths
import { getPlatform } from '../../../../app/scripts/lib/util';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { TraceName, bufferedEndTrace } from '../../../../shared/lib/trace';
import { getFirstTimeFlowType } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';

type SkipSRPBackupProps = {
  onClose: () => void;
  secureYourWallet: () => void;
};

export default function SkipSRPBackup({
  onClose,
  secureYourWallet,
}: SkipSRPBackupProps) {
  const [checked, setChecked] = useState(false);
  const t = useI18nContext();
  const dispatch = useDispatch();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();

  const onSkipSrpBackup = useCallback(async () => {
    await dispatch(setSeedPhraseBackedUp(false));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecuritySkipConfirmed,
      properties: {
        hd_entropy_index: hdEntropyIndex,
      },
    });
    bufferedEndTrace({ name: TraceName.OnboardingNewSrpCreateWallet });
    bufferedEndTrace({ name: TraceName.OnboardingJourneyOverall });

    if (
      getPlatform() === PLATFORM_FIREFOX ||
      firstTimeFlowType === FirstTimeFlowType.restore
    ) {
      history.push(ONBOARDING_COMPLETION_ROUTE);
    } else {
      history.push(ONBOARDING_METAMETRICS);
    }
  }, [dispatch, firstTimeFlowType, hdEntropyIndex, history, trackEvent]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="skip-srp-backup-modal"
      data-testid="skip-srp-backup-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onClose}>
          <Box textAlign={TextAlign.Center}>
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              className="skip-srp-backup-popover__icon"
              color={IconColor.errorDefault}
            />
            <Text
              variant={TextVariant.headingMd}
              textAlign={TextAlign.Center}
              marginTop={4}
              as="h3"
            >
              {t('skipAccountSecurity')}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Checkbox
            id="skip-srp-backup__checkbox"
            className="skip-srp-backup__checkbox"
            data-testid="skip-srp-backup-checkbox"
            isChecked={checked}
            alignItems={AlignItems.flexStart}
            onChange={() => {
              setChecked(!checked);
            }}
            label={
              <Text variant={TextVariant.bodySmMedium}>
                {t('skipAccountSecurityDetails')}
              </Text>
            }
          />
          <Box display={Display.Flex} marginTop={6} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Onboarding,
                  event:
                    MetaMetricsEventName.OnboardingWalletSecuritySkipCanceled,
                  properties: {
                    hd_entropy_index: hdEntropyIndex,
                  },
                });
                secureYourWallet();
              }}
              block
            >
              {t('skipAccountSecuritySecureNow')}
            </Button>
            <Button
              data-testid="skip-srp-backup-button"
              size={ButtonSize.Lg}
              disabled={!checked}
              onClick={onSkipSrpBackup}
              block
              danger
            >
              {t('skipAccountSecuritySkip')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
