import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Color,
  FLEX_DIRECTION,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import {
  BUTTON_TYPES,
  Button,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SnapVersion = ({ version, url }) => {
  const t = useI18nContext();
  return (
    <Button
      type={BUTTON_TYPES.LINK}
      href={url}
      target="_blank"
      className="snap-version"
    >
      <Box
        className="snap-version__wrapper"
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderRadius={BorderRadius.pill}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
      >
        {version ? (
          <Text color={Color.textAlternative} variant={TextVariant.bodyMd}>
            {t('shortVersion', [version])}
          </Text>
        ) : (
          <Preloader size={14} />
        )}
        <Icon
          name={IconName.Export}
          color={Color.textAlternative}
          size={IconSize.Sm}
          marginLeft={1}
        />
      </Box>
    </Button>
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
