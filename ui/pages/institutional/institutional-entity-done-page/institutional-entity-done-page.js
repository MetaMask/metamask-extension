import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Button from '../../../components/ui/button';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Text } from '../../../components/component-library';
import {
  TextColor,
  BorderRadius,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import Box from '../../../components/ui/box';

export default function InstitutionalEntityDonePage(props) {
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const t = useI18nContext();
  const { history, location } = props;
  const { state } = location;

  return (
    <Box borderRadius={BorderRadius.none}>
      <Box className="page-container__content">
        <Box
          paddingBottom={6}
          paddingLeft={6}
          paddingRight={6}
          className="institutional-entity-done__form"
        >
          <Box
            display={['flex']}
            flexDirection={['column']}
            alignItems={['center']}
          >
            <img
              className="institutional-entity-done__img"
              src={state.imgSrc}
              alt="Entity image"
            />
            <Text
              as="h4"
              marginTop={4}
              marginBottom={4}
              color={TextColor.textDefault}
            >
              {state.title}
            </Text>
            <Text
              as="p"
              color={TextColor.textAlternative}
              marginTop={2}
              marginBottom={5}
              variant={TypographyVariant.headingSm}
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
