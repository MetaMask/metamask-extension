import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { setSwapsErrorKey } from '../../../store/actions';
import Box from '../../../components/ui/box';
import {
  DISPLAY,
  AlignItems,
  TextVariant,
  FLEX_DIRECTION,
  TEXT_ALIGN,
  IconColor,
} from '../../../helpers/constants/design-system';
import { Icon, IconName, Text } from '../../../components/component-library';
import { PREPARE_SWAP_ROUTE } from '../../../helpers/constants/routes';
import SwapsFooter from '../swaps-footer';
import { QUOTES_EXPIRED_ERROR } from '../../../../shared/constants/swaps';

export default function NotificationPage({ notificationKey }) {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();

  // TODO: Either add default values or redirect a user out if a notificationKey value is not supported.
  let title = '';
  let description = '';
  let buttonText = '';

  if (notificationKey === QUOTES_EXPIRED_ERROR) {
    title = t('swapAreYouStillThere');
    description = t('swapAreYouStillThereDescription');
    buttonText = t('swapShowLatestQuotes');
  }

  return (
    <div className="notification-page">
      <Box
        alignItems={AlignItems.center}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        marginTop={10}
        marginLeft={4}
        marginRight={4}
        textAlign={TEXT_ALIGN.CENTER}
        className="notification-page__content"
      >
        <Box marginTop={8} marginBottom={4}>
          <Icon
            name={IconName.Warning}
            color={IconColor.iconMuted}
            className="notification-page__warning-icon"
          />
        </Box>
        <Text variant={TextVariant.bodyLgMedium} as="h2">
          {title}
        </Text>
        <Text variant={TextVariant.bodyMd} as="h6">
          {description}
        </Text>
      </Box>
      <SwapsFooter
        onSubmit={async () => {
          await dispatch(setSwapsErrorKey(''));
          history.push(PREPARE_SWAP_ROUTE);
        }}
        submitText={buttonText}
        hideCancel
        showTermsOfService
      />
    </div>
  );
}

NotificationPage.propTypes = {
  notificationKey: PropTypes.oneOf([QUOTES_EXPIRED_ERROR]),
};
