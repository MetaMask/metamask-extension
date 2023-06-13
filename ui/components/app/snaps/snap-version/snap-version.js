import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { Icon, IconName, IconSize, Tag, Box } from '../../../component-library';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SnapVersion = ({ version, url }) => {
  const t = useI18nContext();
  return (
    <Tag
      as="a"
      href={url}
      target="_blank"
      className="snap-version"
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.pill}
      paddingLeft={2}
      paddingRight={2}
      label={
        <>
          {version ? (
            t('shortVersion', [version])
          ) : (
            <Box display={Display.Flex} as="span" padding={1}>
              <Preloader size={12} />
            </Box>
          )}
          <Icon name={IconName.Export} size={IconSize.Xs} marginLeft={1} />
        </>
      }
      labelProps={{
        display: Display.Flex,
        flexDirection: FlexDirection.Row,
        alignItems: AlignItems.center,
      }}
    />
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
