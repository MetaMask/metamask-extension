import React, { useContext } from 'react';

import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Icon, IconName, IconSize, BannerBase, Box } from '../../../components/component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import Card from '../../../components/ui/card';
import { DELEGATION_ROUTE } from '../../../helpers/constants/routes';

import { useHistory } from 'react-router-dom';

const FlaskHomeFooter = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  return (
    <>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={SUPPORT_REQUEST_LINK}
        onClick={() => {
          trackEvent(
            {
              category: MetaMetricsEventCategory.Footer,
              event: MetaMetricsEventName.SupportLinkClicked,
              properties: {
                url: SUPPORT_REQUEST_LINK,
              },
            },
            {
              contextPropsIntoEventProperties: [
                MetaMetricsContextProp.PageTitle,
              ],
            },
          );
        }}
      >
        {t('needHelpSubmitTicket')}
      </a>{' '}
      |{' '}
      <a
        href="https://community.metamask.io/c/developer-discussion/11"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('needHelpFeedback')}
      </a>
      <Box padding={4}>
        <Card backgroundColor={BackgroundColor.backgroundAlternativeSoft} padding={2}>
          <BannerBase
              title="Remote Mode is here!"
              startAccessory={<Icon name={IconName.Info} size={IconSize.Lg} />}
              actionButtonLabel="Get Started"
              actionButtonOnClick={() => {
                history.push(DELEGATION_ROUTE);
              }}
            >
              Access your hardware wallet without plugging it in
          </BannerBase>
        </Card>
      </Box>
    </>
  );
};

export default FlaskHomeFooter;
