import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { complianceActivated } from '../../../ducks/mmi/institutional/institutional';
import { getMMIActions } from '../../../store/actions';
import Button from '../../../components/ui/button';

class ComplianceSettings extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  disconnectFromCompliance = async () => {
    this.props.deleteComplianceAuthData();
  };

  renderDisconnect() {
    const { t } = this.context;

    return (
      <Button
        type="default"
        large
        onClick={this.disconnectFromCompliance}
        data-testid="disconnect-compliance"
      >
        {t('disconnect')}
      </Button>
    );
  }

  renderLinkButton() {
    const { t } = this.context;

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
  }

  render() {
    return this.props.complianceActivated ? (
      <div>
        <div className="institutional-entity__content">
          {this.context.t('complianceSettingsExplanation')}
        </div>
        <footer className="institutional-entity__footer">
          {this.renderDisconnect()}
          {this.renderLinkButton()}
        </footer>
      </div>
    ) : (
      <div data-testid="institutional-content">
        <div className="institutional-entity__content">
          <p>{this.context.t('complianceBlurb0')}</p>
          <br />
          <p>{this.context.t('complianceBlurb1')}</p>
          <br />
          <p>{this.context.t('complianceBlurpStep0')}</p>
          <br />
          <ol>
            <li>{this.context.t('complianceBlurbStep1')}</li>
            <li>{this.context.t('complianceBlurbStep2')}</li>
            <li>{this.context.t('complianceBlurbStep3')}</li>
            <li>{this.context.t('complianceBlurbStep4')}</li>
            <li>{this.context.t('complianceBlurbStep5')}</li>
          </ol>
        </div>
        <footer className="institutional-entity__footer">
          {this.renderLinkButton()}
        </footer>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    complianceActivated: complianceActivated(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  const MMIActions = getMMIActions();
  return {
    deleteComplianceAuthData: () => {
      return dispatch(MMIActions.deleteComplianceAuthData());
    },
  };
};

ComplianceSettings.propTypes = {
  complianceActivated: PropTypes.bool,
  deleteComplianceAuthData: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(ComplianceSettings);
