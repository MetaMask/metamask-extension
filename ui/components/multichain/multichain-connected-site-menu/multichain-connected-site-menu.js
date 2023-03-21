import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { findKey } from 'lodash';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
  Size,
} from '../../../helpers/constants/design-system';
import { BadgeWrapper, Icon, ICON_NAMES } from '../../component-library';
import Box from '../../ui/box';
import {
  getAddressConnectedSubjectMap,
  getConnectedSubjectsForSelectedAddress,
  getOriginOfCurrentTab,
} from '../../../selectors';

export const MultichainConnectedSiteMenu = ({ className, globalMenuColor }) => {
  const connectedSubjects = useSelector(getConnectedSubjectsForSelectedAddress);
  const addressConnectedSubjectMap = useSelector(getAddressConnectedSubjectMap);
  const originOfCurrentTab = useSelector(getOriginOfCurrentTab);
  const tesla = findKey(addressConnectedSubjectMap, originOfCurrentTab);
  console.log(connectedSubjects, globalMenuColor, tesla, 'nidhhh');
  return (
    <Box
      className={classNames('multichain-connected-site-menu', className)}
      data-testid="connection-menu"
    >
      <BadgeWrapper
        badge={
          <Box
            backgroundColor={globalMenuColor}
            borderRadius={BorderRadius.full}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={3}
            style={{ width: 12, height: 12 }}
          />
        }
      >
        <Icon
          name={ICON_NAMES.GLOBAL}
          size={Size.XL}
          color={IconColor.iconDefault}
        />
      </BadgeWrapper>
    </Box>
  );
};

MultichainConnectedSiteMenu.propTypes = {
  /**
   * Additional classNames to be added to the MultichainConnectedSiteMenu
   */
  className: PropTypes.string,
  globalMenuColor: PropTypes.string,
};
