import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Color,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../helpers/constants/design-system';

import { Box } from '../../../component-library/box/box';
import { ButtonLink } from '../../../component-library/button-link/button-link';
import { Icon } from '../../../component-library/icon/icon';
import { IconName, IconSize } from '../../../component-library/icon/icon.types';
import { Text } from '../../../component-library/text/text';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';

const SnapExternalPill = ({ value, url }) => {
  return (
    <ButtonLink
      href={url}
      target="_blank"
      className="snap-external-pill"
      ellipsis
    >
      <Box
        className="snap-external-pill__wrapper"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderRadius={BorderRadius.pill}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
      >
        {value ? (
          <Text
            color={Color.textAlternative}
            variant={TextVariant.bodyMd}
            ellipsis
          >
            {value}
          </Text>
        ) : (
          <Preloader size={18} />
        )}
        <Icon
          name={IconName.Export}
          color={Color.textAlternative}
          size={IconSize.Sm}
          marginLeft={1}
        />
      </Box>
    </ButtonLink>
  );
};

SnapExternalPill.propTypes = {
  /**
   * The value to display
   */
  value: PropTypes.string,
  /**
   * The url to the snap package
   */
  url: PropTypes.string,
};

export default SnapExternalPill;
