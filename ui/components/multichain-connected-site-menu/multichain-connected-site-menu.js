import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  BorderColor,
  BorderRadius,
  Color,
  IconColor,
  Size,
} from '../../helpers/constants/design-system';
import { BadgeWrapper, Icon, ICON_NAMES } from '../component-library';
import Box from '../ui/box';
import { getConnectedSubjectsForSelectedAddress } from '../../selectors';

export const MultichainConnectedSiteMenu = ({ className }) => {
  const connectedSubjects = useSelector(getConnectedSubjectsForSelectedAddress);

  return (
    <Box
      className={classNames('multichain-connected-site-menu', className)}
      data-testid="connection-menu"
    >
      {connectedSubjects?.length ? (
        <BadgeWrapper
          badge={
            <Box
              backgroundColor={Color.successDefault}
              borderRadius={BorderRadius.full}
              borderColor={BorderColor.borderMuted}
              borderWidth={4}
              style={{ width: 14, height: 14 }}
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
              borderWidth={4}
              style={{ width: 14, height: 14 }}
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
  className: PropTypes.string,
};
