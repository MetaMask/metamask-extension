import React, { useState } from 'react';
import {
  BorderColor,
  SEVERITIES,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { Text, Box } from '../../component-library';
import Callout from './callout';

export default {
  title: 'Components/UI/Callout',

  argTypes: {
    severity: {
      control: {
        type: 'select',
      },
      options: Object.values(SEVERITIES),
    },
  },
};

export const PersistentCallout = (args) => (
  <Box borderColor={BorderColor.borderDefault} paddingTop={8}>
    <Box margin={2}>
      <Text variant={TextVariant.headingSm} as="h4">
        This is your private key:
      </Text>
      <Text variant={TextVariant.bodySm} as="h6">
        some seed words that are super important and probably deserve a callout
      </Text>
    </Box>
    <Callout {...args}>Always back up your private key!</Callout>
  </Box>
);

export const DismissibleCallout = (args) => {
  const [dismissed, setDismissed] = useState(false);
  return (
    <Box borderColor={BorderColor.borderDefault} paddingTop={8}>
      <Box margin={2}>
        <Text variant={TextVariant.headingSm} as="h4">
          This is your private key:
        </Text>
        <Text variant={TextVariant.bodySm} as="h6">
          some seed words that are super important and probably deserve a
          callout
        </Text>
      </Box>
      {!dismissed && (
        <Callout {...args} dismiss={() => setDismissed(true)}>
          Always back up your private key!
        </Callout>
      )}
    </Box>
  );
};

const MULTIPLE_CALLOUTS = {
  WARN: {
    severity: SEVERITIES.WARNING,
    content: 'Always back up your private key!',
    dismissed: false,
  },
  DANGER: {
    severity: SEVERITIES.DANGER,
    content: 'Never give your private key out, it will lead to loss of funds!',
    dismissed: false,
  },
};

export const MultipleDismissibleCallouts = () => {
  const [calloutState, setCalloutState] = useState(MULTIPLE_CALLOUTS);
  const dismiss = (id) => {
    setCalloutState((prevState) => ({
      ...prevState,
      [id]: {
        ...prevState[id],
        dismissed: true,
      },
    }));
  };

  return (
    <Box borderColor={BorderColor.borderDefault} paddingTop={8}>
      <Box margin={2}>
        <Text variant={TextVariant.headingSm} as="h4">
          This is your private key:
        </Text>
        <Text variant={TextVariant.bodySm} as="h6">
          some seed words that are super important and probably deserve a
          callout
        </Text>
      </Box>
      {Object.entries(calloutState)
        .filter(([_, callout]) => callout.dismissed === false)
        .map(([id, callout], idx, filtered) => (
          <Callout
            key={id}
            severity={callout.severity}
            dismiss={() => dismiss(id)}
            isFirst={idx === 0}
            isLast={idx + 1 === filtered.length}
            isMultiple={filtered.length > 1}
          >
            {callout.content}
          </Callout>
        ))}
    </Box>
  );
};
