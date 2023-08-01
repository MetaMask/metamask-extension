import React from 'react';
import PropTypes from 'prop-types';

import { useHistory } from 'react-router-dom';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import {
  TextVariant,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextColor,
  Size,
  IconColor,
  Display,
} from '../../../../helpers/constants/design-system';

import {
  Icon,
  IconName,
  Text,
  Box,
  ButtonLink,
  BUTTON_LINK_SIZES,
} from '../../../component-library';

export default function SnapContentFooter({ snapName, snapId }) {
  const t = useI18nContext();
  const history = useHistory();

  const handleNameClick = (e) => {
    e.stopPropagation();
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(snapId)}`);
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      paddingTop={4}
      paddingBottom={4}
      gap={2}
      className="snap-content-footer"
    >
      <Icon
        name={IconName.Warning}
        size={Size.SM}
        color={IconColor.iconMuted}
        marginRight={1}
      />
      <Text color={TextColor.textMuted} variant={TextVariant.bodySm} as="h6">
        {t('snapContent', [
          <ButtonLink
            size={BUTTON_LINK_SIZES.INHERIT}
            onClick={handleNameClick}
            key="button"
          >
            {snapName}
          </ButtonLink>,
        ])}
      </Text>
    </Box>
  );
}

SnapContentFooter.propTypes = {
  /**
   * The name of the snap who's content is displayed
   */
  snapName: PropTypes.string,
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
};
