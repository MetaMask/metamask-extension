import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { ButtonLink, Icon, ICON_NAMES } from '../../component-library';
import {
  AlignItems,
  DISPLAY,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import { detectNewTokens } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import {
  getIsTokenDetectionSupported,
  getIsTokenDetectionInactiveOnMainnet,
} from '../../../selectors';

export const NewImportTokenLink = ({ className = '' }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const history = useHistory();

  const isTokenDetectionSupported = useSelector(getIsTokenDetectionSupported);
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );

  const isTokenDetectionAvailable =
    isTokenDetectionSupported ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);
  return (
    <Box
      className={classnames('import-token-link', className)}
      marginRight={4}
      marginLeft={4}
    >
      <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
        <Icon
          name={ICON_NAMES.IMPORT}
          color={IconColor.infoDefault}
          marginRight={2}
        />
        <ButtonLink
          onClick={() => {
            history.push(IMPORT_TOKEN_ROUTE);
            trackEvent({
              event: EVENT_NAMES.TOKEN_IMPORT_BUTTON_CLICKED,
              category: EVENT.CATEGORIES.NAVIGATION,
              properties: {
                location: 'Home',
              },
            });
          }}
        >
          {isTokenDetectionAvailable
            ? t('importTokens')
            : t('importTokens').charAt(0).toUpperCase() +
              t('importTokens').slice(1)}
        </ButtonLink>
      </Box>
      <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
        <Icon
          name={ICON_NAMES.REFRESH}
          color={IconColor.infoDefault}
          marginRight={2}
        />
        <ButtonLink onClick={() => detectNewTokens()}>
          {t('refreshList')}
        </ButtonLink>
      </Box>
    </Box>
  );
};

NewImportTokenLink.propTypes = {
  /**
   * An additional className to apply to the TokenList.
   */

  className: PropTypes.string,
};
