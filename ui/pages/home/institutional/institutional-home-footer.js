import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ButtonLink, IconName } from '../../../components/component-library';
import { Display, Size } from '../../../helpers/constants/design-system';

const InstitutionalHomeFooter = ({ activitySupportDisplayStyle }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <ButtonLink
      size={Size.MD}
      startIconName={IconName.MessageQuestion}
      data-testid="need-help-link"
      href={SUPPORT_LINK}
      display={Display.Flex}
      justifyContent={activitySupportDisplayStyle.justifyContent}
      paddingLeft={activitySupportDisplayStyle.paddingLeft}
      marginBottom={activitySupportDisplayStyle.marginBottom}
      marginTop={activitySupportDisplayStyle.marginTop}
      onClick={() => {
        trackEvent(
          {
            category: MetaMetricsEventCategory.Home,
            event: MetaMetricsEventName.SupportLinkClicked,
            properties: {
              url: SUPPORT_LINK,
            },
          },
          {
            contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
          },
        );
      }}
      externalLink
    >
      {`${t('appNameMmi')} ${t('support').toLowerCase()}`}
    </ButtonLink>
  );
};

InstitutionalHomeFooter.propTypes = {
  activitySupportDisplayStyle: PropTypes.shape({
    justifyContent: PropTypes.string.isRequired,
    paddingLeft: PropTypes.number,
    marginBottom: PropTypes.number,
    marginTop: PropTypes.number,
  }).isRequired,
};

export default InstitutionalHomeFooter;
