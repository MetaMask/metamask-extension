import { ButtonVariant } from '@metamask/snaps-sdk';
import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Button, ButtonSize } from '../../../components/component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import { BlockSize } from '../../../helpers/constants/design-system';
import { DELEGATION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';

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
      <Button
        key="test"
        variant={ButtonVariant.Primary}
        width={BlockSize.Full}
        size={ButtonSize.Lg}
        onClick={() => {
          console.log('clicked');
          history.push(DELEGATION_ROUTE);
        }}
      >
        Open Delegation Central
      </Button>
    </>
  );
};

export default FlaskHomeFooter;
