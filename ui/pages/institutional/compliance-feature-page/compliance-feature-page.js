import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { I18nContext } from '../../../contexts/i18n';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  JustifyContent,
  DISPLAY,
  AlignItems,
  TextColor,
  TEXT_ALIGN,
  BackgroundColor,
  Color,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import {
  ButtonIcon,
  ICON_NAMES,
  ICON_SIZES,
  Text,
} from '../../../components/component-library';
import Box from '../../../components/ui/box';
import ComplianceSettings from '../../../components/institutional/compliance-settings';

const ComplianceFeaturePage = () => {
  const t = useContext(I18nContext);
  const history = useHistory();

  const complianceActivated = useSelector((state) =>
    Boolean(state.metamask.institutionalFeatures?.complianceProjectId),
  );

  return (
    <Box
      className="institutional-entity"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <>
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
          padding={[0, 6, 6]}
          className="feature-connect__header"
        >
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={ICON_NAMES.ARROW_LEFT}
            size={ICON_SIZES.SM}
            className="settings-page__back-button"
            color={Color.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
            display={[DISPLAY.FLEX]}
          />
          <Text
            as="h4"
            marginTop={4}
            marginBottom={4}
            className="feature-connect__header__title"
          >
            <Box
              display={DISPLAY.FLEX}
              alignItems={AlignItems.center}
              color={TextColor.textDefault}
            >
              <img
                className="feature-connect__list__list-item__img"
                src="images/compliance-logo-small.svg"
                alt="Codefi Compliance"
              />
              {t('codefiCompliance')}
              {complianceActivated && (
                <Text
                  as="h6"
                  margin={[2, 2, 0, 2]}
                  color={TextColor.textMuted}
                  display={DISPLAY.FLEX}
                  textAlign={TEXT_ALIGN.LEFT}
                  flexDirection={FLEX_DIRECTION.COLUMN}
                  justifyContent={JustifyContent.center}
                  className="feature-connect__label__text feature-connect__label__text--activated"
                  data-testid="activated-label"
                >
                  {t('activated')}
                </Text>
              )}
            </Box>
          </Text>
        </Box>
        <ComplianceSettings />
      </>
    </Box>
  );
};

export default ComplianceFeaturePage;
