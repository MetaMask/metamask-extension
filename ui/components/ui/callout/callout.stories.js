import React, { useState } from 'react';
import {
  COLORS,
  SEVERITIES,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Box from '../box';
import Typography from '../typography';
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
  <Box borderColor={COLORS.BORDER_DEFAULT} paddingTop={8}>
    <Box margin={2}>
      <Typography variant={TYPOGRAPHY.H4}>This is your private key:</Typography>
      <Typography variant={TYPOGRAPHY.H6}>
        some seed words that are super important and probably deserve a callout
      </Typography>
    </Box>
    <Callout {...args}>Always back up your private key!</Callout>
  </Box>
);

export const DismissibleCallout = (args) => {
  const [dismissed, setDismissed] = useState(false);
  return (
    <Box borderColor={COLORS.BORDER_DEFAULT} paddingTop={8}>
      <Box margin={2}>
        <Typography variant={TYPOGRAPHY.H4}>
          This is your private key:
        </Typography>
        <Typography variant={TYPOGRAPHY.H6}>
          some seed words that are super important and probably deserve a
          callout
        </Typography>
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
    <Box borderColor={COLORS.BORDER_DEFAULT} paddingTop={8}>
      <Box margin={2}>
        <Typography variant={TYPOGRAPHY.H4}>
          This is your private key:
        </Typography>
        <Typography variant={TYPOGRAPHY.H6}>
          some seed words that are super important and probably deserve a
          callout
        </Typography>
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
