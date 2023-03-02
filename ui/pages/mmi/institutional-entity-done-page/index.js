import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from '../../../components/ui/button';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';

class InstitutionalEntityDonePage extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  render() {
    const { history, mostRecentOverviewPage, location } = this.props;
    const { state } = location;

    return (
      <div className="page-container institutional-entity__container">
        <div className="page-container__content">
          <div className="institutional-entity__form">
            <div className="entity-connect__compliance-activated">
              <img
                className="entity-connect__compliance-activated__img"
                src={state.imgSrc}
                alt="Entity image"
              />
              <h4 className="entity-connect__header__title">{state.title}</h4>
              <p className="entity-connect__header__msg">{state.description}</p>
            </div>
          </div>
        </div>
        <div className="page-container__footer">
          <footer>
            <Button
              type="primary"
              large
              className="page-container__footer-button"
              onClick={() => history.push(mostRecentOverviewPage)}
            >
              {this.context.t('close')}
            </Button>
          </footer>
        </div>
      </div>
    );
  }
}

InstitutionalEntityDonePage.propTypes = {
  history: PropTypes.object,
  location: PropTypes.object,
  mostRecentOverviewPage: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
};

export default connect(mapStateToProps)(InstitutionalEntityDonePage);
