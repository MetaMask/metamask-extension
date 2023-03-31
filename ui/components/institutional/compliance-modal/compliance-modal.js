import React from 'react';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { hideModal } from '../../../store/actions';
import Modal from '../../app/modal';
import Box from '../../ui/box';
import {
  Text,
  ButtonIcon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../component-library';
import {
  AlignItems,
  JustifyContent,
  TextColor,
  DISPLAY,
} from '../../../helpers/constants/design-system';

const ComplianceModal = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const handleSubmit = () => {
    global.platform.openTab({
      url: 'https://start.compliance.codefi.network/',
    });
  };

  const handleClose = () => dispatch(hideModal());

  return (
    <Modal
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText={t('openCodefiCompliance')}
      submitType="primary"
    >
      <Box className="compliance-modal">
        <Box
          as="header"
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.flexStart}
            alignItems={AlignItems.center}
          >
            <img
              height={32}
              width={32}
              src="images/compliance-logo-small.svg"
              alt="Codefi Compliance"
            />
            <Text as="h4" marginLeft={2} color={TextColor.textDefault}>
              {t('codefiCompliance')}
            </Text>
          </Box>
          <ButtonIcon
            data-testid="compliance-modal-close"
            iconName={ICON_NAMES.CLOSE}
            size={ICON_SIZES.SM}
            ariaLabel={t('close')}
            onClick={handleClose}
          />
        </Box>
        <Text data-testid="compliance-info" paddingBottom={3}>{t('complianceBlurb0')}</Text>
        <Text paddingBottom={3}>{t('complianceBlurb1')}</Text>
        <Text paddingBottom={3}>{t('complianceBlurpStep0')}</Text>
        <ol data-testid="compliance-bullets">
          <li>{t('complianceBlurbStep1')}</li>
          <li>{t('complianceBlurbStep2')}</li>
          <li>{t('complianceBlurbStep3')}</li>
          <li>{t('complianceBlurbStep4')}</li>
          <li>{t('complianceBlurbStep5')}</li>
        </ol>
      </Box>
    </Modal>
  );
};

export default ComplianceModal;
