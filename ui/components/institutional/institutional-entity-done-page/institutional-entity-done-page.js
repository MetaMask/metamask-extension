import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Button from '../../ui/button';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function InstitutionalEntityDonePage(props) {
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const t = useI18nContext();
  const { history, location } = props;
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
            data-testid="click-most-recent-overview-page"
            onClick={() => history.push(mostRecentOverviewPage)}
          >
            {t('close')}
          </Button>
        </footer>
      </div>
    </div>
  );
}

InstitutionalEntityDonePage.propTypes = {
  history: PropTypes.object,
  location: PropTypes.object,
};
