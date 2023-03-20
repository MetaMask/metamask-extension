import React from 'react';
import PropTypes from 'prop-types';
import { Text, Label } from '../../component-library';
import {
  TEXT_TRANSFORM,
  BackgroundColor,
  TextColor,
  FONT_WEIGHT,
  BorderRadius,
  TypographyVariant,
} from '../../../helpers/constants/design-system';

const CustodyLabels = (props) => {
  const { labels, index, background, hideNetwork } = props;
  const filteredLabels = hideNetwork
    ? labels.filter((item) => item.key !== 'network_name')
    : labels;

  return (
    <Label
      display={['flex']}
      flexDirection={['row']}
      htmlFor={`address-${index || 0}`}
    >
      {filteredLabels.map((item) => (
        <Text
          key={item.key}
          textTransform={TEXT_TRANSFORM.UPPERCASE}
          className="custody-label"
          style={background ? { background } : {}}
          marginTop={1}
          marginRight={1}
          marginBottom={2}
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={BackgroundColor.backgroundAlternative}
          color={TextColor.textMuted}
          fontWeight={FONT_WEIGHT.NORMAL}
          borderRadius={BorderRadius.SM}
          variant={TypographyVariant.H9}
        >
          {item.value}
        </Text>
      ))}
    </Label>
  );
};

CustodyLabels.propTypes = {
  labels: PropTypes.array,
  index: PropTypes.string,
  background: PropTypes.string,
  hideNetwork: PropTypes.bool,
};

export default CustodyLabels;
