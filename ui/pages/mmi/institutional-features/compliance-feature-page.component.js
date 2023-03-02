import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { complianceActivated } from '../../../ducks/mmi/institutional/institutional';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import ComplianceSettings from './compliance-settings.component';

class ComplianceFeaturePage extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  renderSelectInstitutionalFeature() {
    const { t } = this.context;
    const { history } = this.props;

    return (
      <>
        <div className="feature-connect__header">
          <button
            className="feature-connect__header__back-btn"
            onClick={() => history.push(DEFAULT_ROUTE)}
          >
            <i className="fas fa-chevron-left feature-connect__header__back-btn__chevron-left" />
            {t('back')}
          </button>
          <h4 className="feature-connect__header__title">
            <span className="feature-connect__list__list-item__avatar">
              <img
                className="feature-connect__list__list-item__img"
                src="images/compliance-logo-small.svg"
                alt="Codefi Compliance"
              />
              {t('codefiCompliance')}
              {this.props.complianceActivated && (
                <p
                  className="entity-connect__btn__text entity-connect__btn__text--activated"
                  data-testid="activated-label"
                >
                  {t('activated')}
                </p>
              )}
            </span>
          </h4>
        </div>
        <ComplianceSettings />
      </>
    );
  }

  render() {
    return (
      <div className="institutional-entity width500">
        {this.renderSelectInstitutionalFeature()}
      </div>
    );
  }
}

ComplianceFeaturePage.propTypes = {
  complianceActivated: PropTypes.bool,
  history: PropTypes.object,
};

const mapStateToProps = (state) => {
  return {
    complianceActivated: complianceActivated(state),
  };
};

export default connect(mapStateToProps)(ComplianceFeaturePage);
