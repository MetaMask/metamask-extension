import React from 'react';
import PropTypes from 'prop-types';

import { useHistory } from 'react-router-dom';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import {
  TextVariant,
  JustifyContent,
  AlignItems,
  TextColor,
  Size,
  IconColor,
} from '../../../../helpers/constants/design-system';
import Button from '../../../ui/button';
import Box from '../../../ui/box/box';
import { Icon, IconName, Text } from '../../../component-library';

export default function SnapContentFooter({ snapName, snapId }) {
  const t = useI18nContext();
  const history = useHistory();

  const handleNameClick = (e) => {
    e.stopPropagation();
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(snapId)}`);
  };
  // TODO: add truncation to the snap name, need to pick a character length at which to cut off
  return (
    <Box
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      paddingTop={4}
      paddingBottom={4}
      className="snap-content-footer"
    >
      <Icon
        name={IconName.Warning}
        size={Size.SM}
        color={IconColor.iconMuted}
        paddingRight={1}
      />
      <Text color={TextColor.textMuted} variant={TextVariant.bodySm} as="h6">
        {t('snapContent', [
          <Button type="inline" onClick={handleNameClick} key="button">
            {snapName}
          </Button>,
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
