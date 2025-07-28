import React, { useState, useEffect } from 'react';
import { TextColor, TextVariant } from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library';

const formatTimeToUnlock = (timeInSeconds: number) => {
  if (timeInSeconds <= 60) {
    return `${timeInSeconds} seconds.`;
  }
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.`;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function FormattedCounter({
  startFrom,
  onCountdownEnd,
}: {
  startFrom: number;
  onCountdownEnd: () => void;
}) {
  const [time, setTime] = useState(startFrom);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime((val) => {
        if (val <= 0) {
          clearInterval(intervalId);
          onCountdownEnd();
          return 0;
        }
        return val - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [onCountdownEnd]);

  return (
    <Text variant={TextVariant.inherit} color={TextColor.inherit} as="span">
      {formatTimeToUnlock(time)}
    </Text>
  );
}
