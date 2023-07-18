import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  JustifyContent,
  Display,
  TextColor,
  FlexDirection,
  TextVariant,
  BorderStyle,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import {
  Button,
  BUTTON_VARIANT,
  BUTTON_SIZES,
  Text,
  Box,
} from '../../component-library';

const ComplianceSettings = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();

  const complianceActivated = useSelector((state) =>
    Boolean(state.metamask.institutionalFeatures?.complianceProjectId),
  );

  const linkButton = (
    <Button
      variant={BUTTON_VARIANT.LINK}
      size={BUTTON_SIZES.LG}
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

  return complianceActivated ? (
    <Box>
      <Text
        variant={TextVariant.bodySm}
        as="h6"
        className="institutional-feature__content"
      >
        {t('complianceSettingsExplanation')}
      </Text>
      <Box
        padding={[4, 6]}
        borderWidth={1}
        borderStyle={BorderStyle.solid}
        borderColor={BorderColor.borderMuted}
        className="institutional-feature__footer"
      >
        <Button
          size={BUTTON_SIZES.LG}
          onClick={() => {
            dispatch(mmiActions.deleteComplianceAuthData());
          }}
          data-testid="disconnect-compliance"
        >
          {t('disconnect')}
        </Button>
        {linkButton}
      </Box>
    </Box>
  ) : (
    <Box
      padding={[0, 6]}
      color={TextColor.textAlternative}
      data-testid="institutional-content"
    >
      <Box
        variant={TextVariant.bodySm}
        className="institutional-feature__content"
      >
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
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.center}
      >
        <Box
          padding={[4, 6]}
          borderWidth={1}
          borderStyle={BorderStyle.solid}
          borderColor={BorderColor.borderMuted}
          className="institutional-feature__footer"
        >
          {linkButton}
        </Box>
      </Box>
    </Box>
  );
};

export default ComplianceSettings;
