import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  JustifyContent,
  DISPLAY,
  TextColor,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { Text } from '../../component-library';
import Box from '../../ui/box';
import Button from '../../ui/button';

const ComplianceSettings = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();

  const complianceActivated = useSelector((state) =>
    Boolean(state.metamask.institutionalFeatures?.complianceProjectId),
  );

  const disconnectFromCompliance = async () => {
    await dispatch(mmiActions.deleteComplianceAuthData());
  };

  const renderDisconnect = () => {
    return (
      <Button
        type="default"
        large
        onClick={disconnectFromCompliance}
        data-testid="disconnect-compliance"
      >
        {t('disconnect')}
      </Button>
    );
  };

  const renderLinkButton = () => {
    return (
      <Button
        type="primary"
        data-testid="start-compliance"
        onClick={() => {
          global.platform.openTab({
            url: 'https://start.compliance.codefi.network/',
          });
        }}
      >
        {t('openCodefiCompliance')}
      </Button>
    );
  };

  return complianceActivated ? (
    <Box>
      <Box className="institutional-feature__content">
        {t('complianceSettingsExplanation')}
      </Box>
      <footer className="institutional-feature__footer">
        {renderDisconnect()}
        {renderLinkButton()}
      </footer>
    </Box>
  ) : (
    <Box
      padding={[0, 6]}
      color={TextColor.textAlternative}
      data-testid="institutional-content"
    >
      <Box className="institutional-feature__content">
        <Text paddingBottom={3}>{t('complianceBlurb0')}</Text>
        <Text paddingBottom={3}>{t('complianceBlurb1')}</Text>
        <Text paddingBottom={3}>{t('complianceBlurpStep0')}</Text>
        <ol>
          <li>{t('complianceBlurbStep1')}</li>
          <li>{t('complianceBlurbStep2')}</li>
          <li>{t('complianceBlurbStep3')}</li>
          <li>{t('complianceBlurbStep4')}</li>
          <li>{t('complianceBlurbStep5')}</li>
        </ol>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JustifyContent.center}
      >
        <footer padding={[4, 6]} className="institutional-feature__footer">
          {renderLinkButton()}
        </footer>
      </Box>
    </Box>
  );
};

export default ComplianceSettings;
