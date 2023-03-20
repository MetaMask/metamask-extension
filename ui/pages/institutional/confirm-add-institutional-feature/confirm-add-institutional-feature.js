import React, { useState, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import PulseLoader from '../../../components/ui/pulse-loader';
import { INSTITUTIONAL_FEATURES_DONE_ROUTE } from '../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';
import { getMMIActions } from '../../../store/actions';

export default function ConfirmAddInstitutionalFeature({ history }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const MMIActions = getMMIActions();
  const [isLoading, setIsLoading] = useState(false);
  const [connectError, setConnectError] = useState('');
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const connectRequests = useSelector(getInstitutionalConnectRequests);
  const trackEvent = useContext(MetaMetricsContext);
  const connectRequest = connectRequests[0];

  const handleConnectError = ({ message }) => {
    let error = message.startsWith('401') ? t('projectIdInvalid') : message;
    if (!error) {
      error = 'Connection error';
    }
    setIsLoading(false);
    setConnectError(error);

    trackEvent({
      category: 'MMI',
      event: 'Institutional feature connection',
      properties: {
        actions: 'Institutional feature RPC error',
      },
    });
  };

  const removeConnectInstitutionalFeature = ({ actions, service, push }) => {
    dispatch(
      MMIActions.removeConnectInstitutionalFeature({
        origin: connectRequest.origin,
        projectId: connectRequest.token.projectId,
      }),
    );

    trackEvent({
      category: 'MMI',
      event: 'Institutional feature connection',
      properties: {
        actions,
        service,
      },
    });

    history.push(push);
  };

  if (!connectRequest) {
    history.push(mostRecentOverviewPage);
    return null;
  }

  const serviceLabel = connectRequest.labels.find(
    (label) => label.key === 'service',
  );
  // TODO: Replace project ID here with something more generic
  trackEvent({
    category: 'MMI',
    event: 'Institutional feature connection',
    properties: {
      actions: 'Institutional feature RPC request',
      service: serviceLabel.value,
    },
  });

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">Institutional Feature</div>
        <div className="page-container__subtitle">
          {t('mmiAuthenticate', [connectRequest.origin, serviceLabel.value])}
        </div>
      </div>
      <div className="page-container__content">
        <div className="institutional_feature_spacing">Project Name</div>
        <div className="institutional_feature_confirm__token">
          {connectRequest?.token?.projectName}
        </div>
        <div className="institutional_feature_confirm__token--projectId">
          ID: {connectRequest?.token?.projectId}
        </div>
      </div>
      {connectError && (
        <div className="institutional_feature_confirm__error">
          <p className="error">{connectError}</p>
        </div>
      )}

      <div className="page-container__footer">
        {isLoading ? (
          <footer>
            <PulseLoader />
          </footer>
        ) : (
          <footer>
            <Button
              type="default"
              large
              className="page-container__footer-button"
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
              className="page-container__footer-button"
              onClick={async () => {
                setIsLoading(true);
                setConnectError('');

                try {
                  await dispatch(
                    MMIActions.setComplianceAuthData({
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
              }}
            >
              {t('confirm')}
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}

ConfirmAddInstitutionalFeature.propTypes = {
  history: PropTypes.object,
};
