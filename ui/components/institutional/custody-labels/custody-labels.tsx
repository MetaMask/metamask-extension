import React from 'react';
import { Label, Text } from '../../component-library';

import {
  TextTransform,
  BackgroundColor,
  TextColor,
  FontWeight,
  BorderRadius,
  TextVariant,
  Display,
} from '../../../helpers/constants/design-system';
import { LabelItem } from '../../../pages/institutional/custody/custody';

type CustodyLabelsProps = {
  labels: LabelItem[];
  index?: string;
  background?: string;
  hideNetwork?: boolean;
};

const CustodyLabels: React.FC<CustodyLabelsProps> = (props) => {
  const { labels, index, background, hideNetwork } = props;
  const filteredLabels = hideNetwork
    ? labels.filter((item) => item.key !== 'network_name')
    : labels;

  return (
    <Label display={Display.Flex} htmlFor={`address-${index || 0}`}>
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

export default CustodyLabels;
