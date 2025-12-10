import React, { useCallback, useContext, useState, useEffect } from 'react';
import {
  Box,
  Text,
  ButtonIcon,
  IconName,
  ButtonIconSize,
} from '../../components/component-library';
import {
  Display,
  AlignItems,
  TextVariant,
  TextColor,
  IconColor,
  BlockSize,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';
import SrpInputImport from '../../components/app/srp-input-import';
import SRPDetailsModal from '../../components/app/srp-details-modal';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';

type SrpInputFormProps = {
  error?: string;
  setSecretRecoveryPhrase: (secretRecoveryPhrase: string) => void;
  onClearCallback: () => void;
  /**
   * Whether to show the default description
   */
  showDescription?: boolean;
  /**
   * Whether to toggle the SRP details modal when you have a custom description
   */
  toggleSrpDetailsModal?: boolean;
  /**
   * Callback to close the SRP details modal when you have a custom description
   */
  onSrpDetailsModalClose?: () => void;
};

const SrpInputForm = ({
  error,
  setSecretRecoveryPhrase,
  onClearCallback,
  showDescription = true,
  toggleSrpDetailsModal = false,
  onSrpDetailsModalClose,
}: SrpInputFormProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [showSrpDetailsModal, setShowSrpDetailsModal] = useState(false);

  useEffect(() => {
    setShowSrpDetailsModal(toggleSrpDetailsModal);
  }, [toggleSrpDetailsModal]);

  const onShowSrpDetailsModal = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SrpDefinitionClicked,
      properties: {
        location: 'import_srp',
      },
    });
    setShowSrpDetailsModal(true);
  }, [trackEvent]);

  return (
    <>
      {showSrpDetailsModal && (
        <SRPDetailsModal
          onClose={() => {
            setShowSrpDetailsModal(false);
            onSrpDetailsModalClose?.();
          }}
        />
      )}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
        height={BlockSize.Full}
      >
        {showDescription && (
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {t('typeYourSRP')}
            </Text>
            <ButtonIcon
              iconName={IconName.Info}
              size={ButtonIconSize.Sm}
              color={IconColor.iconAlternative}
              onClick={onShowSrpDetailsModal}
              ariaLabel="info"
            />
          </Box>
        )}
        <Box width={BlockSize.Full}>
          <form onSubmit={(e) => e.preventDefault()}>
            <SrpInputImport
              onChange={setSecretRecoveryPhrase}
              onClearCallback={onClearCallback}
            />
            {error && (
              <Box marginTop={2}>
                <Text
                  data-testid="import-srp-error"
                  variant={TextVariant.bodySm}
                  color={TextColor.errorDefault}
                >
                  {error}
                </Text>
              </Box>
            )}
          </form>
        </Box>
      </Box>
    </>
  );
};

export default SrpInputForm;
