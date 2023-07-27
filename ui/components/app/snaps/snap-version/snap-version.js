import React from 'react';
import PropTypes from 'prop-types';
import {
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  ButtonBase,
  ButtonBaseSize,
  IconName,
} from '../../../component-library';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';

const SnapVersion = ({ version, url }) => {
  return (
    <ButtonBase
      className="snap-version"
      as="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      endIconName={IconName.Export}
      size={ButtonBaseSize.Sm}
      paddingLeft={2}
      paddingRight={2}
      variant={TextVariant.bodyMd}
      textProps={{ display: Display.Flex }}
    >
      {version || <Preloader size={16} />}
    </ButtonBase>
  );
};

SnapVersion.propTypes = {
  /**
   * The version of the snap
   */
  version: PropTypes.string,
  /**
   * The url to the snap package
   */
  url: PropTypes.string,
};

export default SnapVersion;
