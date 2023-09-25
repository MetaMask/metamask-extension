import React from 'react';
import PropTypes from 'prop-types';
import { Label, Text } from '../../component-library';

import {
  TextTransform,
  BackgroundColor,
  TextColor,
  FontWeight,
  BorderRadius,
  TextVariant,
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
          textTransform={TextTransform.Capitalize}
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
          color={TextColor.textDefault}
          fontWeight={FontWeight.Normal}
          borderRadius={BorderRadius.SM}
          variant={TextVariant.bodyXs}
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
