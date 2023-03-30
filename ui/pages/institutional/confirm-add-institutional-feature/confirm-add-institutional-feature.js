import React, { useState, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import PulseLoader from '../../../components/ui/pulse-loader';
import { INSTITUTIONAL_FEATURES_DONE_ROUTE } from '../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { Text } from '../../../components/component-library';
import {
  TextColor,
  TextVariant,
  OVERFLOW_WRAP,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import Box from '../../../components/ui/box';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';

export default function ConfirmAddInstitutionalFeature({ history }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const [isLoading, setIsLoading] = useState(false);
  const [connectError, setConnectError] = useState('');
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const connectRequests = useSelector(
    (state) => state.metamask.institutionalFeatures?.connectRequests,
  );

  const trackEvent = useContext(MetaMetricsContext);
  const connectRequest = connectRequests[0];

  useEffect(() => {
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
    }
    return null;
  }, [connectRequest, history, mostRecentOverviewPage]);

  const serviceLabel = connectRequest.labels.find(
    (label) => label.key === 'service',
  );

  const sendEvent = ({ actions, service }) => {
    trackEvent({
      category: 'MMI',
      event: 'Institutional feature connection',
      properties: {
        actions,
        service,
      },
    });
  };

  const handleConnectError = ({ message }) => {
    let error = message.startsWith('401') ? t('projectIdInvalid') : message;
    if (!error) {
      error = 'Connection error';
    }
    setIsLoading(false);
    setConnectError(error);
    sendEvent({ actions: 'Institutional feature RPC error' });
  };

  const removeConnectInstitutionalFeature = ({ actions, service, push }) => {
    dispatch(
      mmiActions.removeConnectInstitutionalFeature({
        origin: connectRequest.origin,
        projectId: connectRequest.token.projectId,
      }),
    );
    sendEvent({ actions, service });
    history.push(push);
  };

  const confirmAddInstitutionalFeature = async () => {
    setIsLoading(true);
    setConnectError('');

    try {
      await dispatch(
        mmiActions.setComplianceAuthData({
          clientId: connectRequest.token.clientId,
          projectId: connectRequest.token.projectId,
        }),
      );
      removeConnectInstitutionalFeature({
        actions: 'Institutional feature RPC confirm',
        service: serviceLabel.value,
        push: {
          pathname: INSTITUTIONAL_FEATURES_DONE_ROUTE,
          state: {
            imgSrc: 'images/compliance-logo.png',
            title: t('complianceActivatedTitle'),
            description: t('complianceActivatedDesc'),
          },
        },
      });
    } catch (e) {
      handleConnectError(e);
    }
  };

  sendEvent({
    actions: 'Institutional feature RPC request',
    service: serviceLabel.value,
  });

  return (
    <Box className="page-container">
      <Box className="page-container__header">
        <Text className="page-container__title">
          {t('institutionalFeatures')}
        </Text>
        <Text className="page-container__subtitle">
          {t('mmiAuthenticate', [connectRequest.origin, serviceLabel.value])}
        </Text>
      </Box>
      <Box className="page-container__content">
        <Text
          variant={TextVariant.bodySm}
          marginTop={3}
          marginRight={8}
          marginBottom={0}
          marginLeft={8}
        >
          {t('projectName')}
        </Text>
        <Text
          variant={TextVariant.bodyLgMedium}
          color={TextColor.textDefault}
          marginTop={1}
          marginRight={8}
          marginBottom={1}
          marginLeft={8}
          overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
        >
          {connectRequest?.token?.projectName}
        </Text>
        <Text
          variant={TextVariant.bodyXs}
          marginRight={8}
          marginLeft={8}
          overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
          color={TextColor.textMuted}
        >
          {t('id')}: {connectRequest?.token?.projectId}
        </Text>
      </Box>
      {connectError && (
        <Text textAlign={TEXT_ALIGN.CENTER} marginTop={4}>
          {connectError}
        </Text>
      )}

      <Box className="page-container__footer">
        {isLoading ? (
          <footer>
            <PulseLoader />
          </footer>
        ) : (
          <footer>
            <Button
              type="default"
              large
              onClick={() => {
                removeConnectInstitutionalFeature({
                  actions: 'Institutional feature RPC cancel',
                  service: serviceLabel.value,
                  push: mostRecentOverviewPage,
                });
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="primary"
              large
              onClick={confirmAddInstitutionalFeature}
            >
              {t('confirm')}
            </Button>
          </footer>
        )}
      </Box>
    </Box>
  );
}

ConfirmAddInstitutionalFeature.propTypes = {
  history: PropTypes.object,
};
