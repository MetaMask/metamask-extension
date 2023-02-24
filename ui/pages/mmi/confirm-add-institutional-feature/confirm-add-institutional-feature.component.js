import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import PulseLoader from '../../components/ui/pulse-loader';
import { INSTITUTIONAL_FEATURES_DONE_ROUTE } from '../../helpers/constants/routes';

export default class ConfirmAddInstitutionalFeature extends Component {
  state = {
    isLoading: false,
    connectError: '',
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    removeConnectInstitutionalFeature: PropTypes.func,
    setComplianceAuthData: PropTypes.func,
    connectRequests: PropTypes.arrayOf(PropTypes.object),
  };

  handleConnectError(e) {
    let connectError = e.message.startsWith('401')
      ? this.context.t('projectIdInvalid')
      : e.message;
    if (!connectError) {
      connectError = 'Connection error';
    }
    this.setState({ connectError, isLoading: false });

    this.context.trackEvent({
      category: 'MMI',
      event: 'Institutional feature connection',
      properties: {
        actions: 'Institutional feature RPC error',
      },
    });
  }

  render() {
    const {
      history,
      mostRecentOverviewPage,
      removeConnectInstitutionalFeature,
      setComplianceAuthData,
      connectRequests,
    } = this.props;
    const connectRequest = connectRequests[0];
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      return null;
    }

    const serviceLabel = connectRequest.labels.find(
      (label) => label.key === 'service',
    );
    // TODO: Replace project ID here with something more generic
    this.context.trackEvent({
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
            {this.context.t('mmiAuthenticate', [
              connectRequest.origin,
              serviceLabel.value,
            ])}
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
        {!this.state.complianceActivated && (
          <div className="institutional_feature_confirm__error">
            <p className="error">{this.state.connectError}</p>
          </div>
        )}

        <div className="page-container__footer">
          {this.state.isLoading ? (
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
                    origin: connectRequest.origin,
                    projectId: connectRequest.token.projectId,
                  });

                  this.context.trackEvent({
                    category: 'MMI',
                    event: 'Institutional feature connection',
                    properties: {
                      actions: 'Institutional feature RPC cancel',
                      service: serviceLabel.value,
                    },
                  });
                  history.push(mostRecentOverviewPage);
                }}
              >
                {this.context.t('cancel')}
              </Button>
              <Button
                type="primary"
                large
                className="page-container__footer-button"
                onClick={async () => {
                  this.setState({ connectError: '', isLoading: true });

                  try {
                    await setComplianceAuthData({
                      clientId: connectRequest.token.clientId,
                      projectId: connectRequest.token.projectId,
                    });

                    removeConnectInstitutionalFeature({
                      origin: connectRequest.origin,
                      projectId: connectRequest.token.projectId,
                    });
                    history.push({
                      pathname: INSTITUTIONAL_FEATURES_DONE_ROUTE,
                      state: {
                        imgSrc: 'images/compliance-logo.png',
                        title: this.context.t('complianceActivatedTitle'),
                        description: this.context.t('complianceActivatedDesc'),
                      },
                    });

                    this.context.trackEvent({
                      category: 'MMI',
                      event: 'Institutional feature connection',
                      properties: {
                        actions: 'Institutional feature RPC confirm',
                        service: serviceLabel.value,
                      },
                    });
                  } catch (e) {
                    this.handleConnectError(e);
                  }
                }}
              >
                {this.context.t('confirm')}
              </Button>
            </footer>
          )}
        </div>
      </div>
    );
  }
}
