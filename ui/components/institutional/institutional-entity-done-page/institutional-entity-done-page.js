import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Button from '../../ui/button';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Text } from '../../component-library';
import Box from '../../ui/box';

export default function InstitutionalEntityDonePage(props) {
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const t = useI18nContext();
  const { history, location } = props;
  const { state } = location;

  return (
    <Box className="page-container institutional-entity-done__container">
      <Box className="page-container__content">
        <Box
          paddingBottom={6}
          paddingLeft={6}
          paddingRight={6}
          className="institutional-entity-done__form"
        >
          <Box className="institutional-entity-done__entity-connect__compliance-activated">
            <img
              className="institutional-entity-done__entity-connect__compliance-activated__img"
              src={state.imgSrc}
              alt="Entity image"
            />
            <Text
              as="h4"
              className="institutional-entity-done__entity-connect__header__title"
            >
              {state.title}
            </Text>
            <Text
              as="p"
              className="institutional-entity-done__entity-connect__header__msg"
            >
              {state.description}
            </Text>
          </Box>
        </Box>
      </Box>
      <Box className="page-container__footer">
        <footer>
          <Button
            type="primary"
            large
            className="page-container__footer-button"
            data-testid="click-most-recent-overview-page"
            onClick={() => history.push(mostRecentOverviewPage)}
          >
            <Text>{t('close')}</Text>
          </Button>
        </footer>
      </Box>
    </Box>
  );
}

InstitutionalEntityDonePage.propTypes = {
  history: PropTypes.object,
  location: PropTypes.object,
};
