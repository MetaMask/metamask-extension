import React from 'react';
import PropTypes from 'prop-types';
import {
  BorderColor,
  BorderRadius,
  Color,
  IconColor,
  Size,
} from '../../helpers/constants/design-system';
import { BadgeWrapper, Icon, ICON_NAMES } from '../component-library';
import Box from '../ui/box';

export const MultichainConnectedSiteMenu = ({ connectedSubjects }) => {
  return (
    <Box>
      {connectedSubjects.length ? (
        <BadgeWrapper
          badge={
            <Box
              backgroundColor={Color.successDefault}
              borderRadius={BorderRadius.full}
              borderColor={BorderColor.borderMuted}
              borderWidth={2}
              style={{ width: 12, height: 12 }}
            />
          }
        >
          <Icon
            name={ICON_NAMES.GLOBAL}
            size={Size.XL}
            color={IconColor.iconAlternative}
          />
        </BadgeWrapper>
      ) : (
        <BadgeWrapper
          badge={
            <Box
              backgroundColor={Color.backgroundDefault}
              borderRadius={BorderRadius.full}
              borderColor={BorderColor.borderMuted}
              borderWidth={2}
            />
          }
        >
          <Icon
            name={ICON_NAMES.GLOBAL}
            size={Size.XL}
            color={IconColor.iconAlternative}
          />
        </BadgeWrapper>
      )}
    </Box>
  );
};

MultichainConnectedSiteMenu.propTypes = {
  connectedSubjects: PropTypes.arrayOf(PropTypes.object).isRequired,
};
