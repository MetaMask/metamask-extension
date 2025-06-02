import React, { useState, useEffect } from 'react';
import { TextColor, TextVariant } from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library';

const formatTimeToUnlock = (timeInSeconds: number) => {
  if (timeInSeconds <= 60) {
    return `${timeInSeconds}s`;
  } else if (timeInSeconds < 3600) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}m:${seconds.toString().padStart(2, '0')}s`;
  }
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return `${hours}hr:${minutes.toString().padStart(2, '0')}m:${seconds
    .toString()
    .padStart(2, '0')}s`;
};

export default function FormattedCounter({
  remainingTime,
  unlock,
}: {
  remainingTime: number;
  unlock: () => void;
}) {
  const [time, setTime] = useState(remainingTime);

  useEffect(() => {
    let updatedTime = time;
    const interval = setInterval(() => {
      updatedTime -= 1;
      if (updatedTime < 0) {
        clearInterval(interval);
        unlock();
      } else {
        setTime(updatedTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [time, unlock]);

  return (
    <Text variant={TextVariant.inherit} color={TextColor.inherit} as="span">
      {formatTimeToUnlock(time)}
    </Text>
  );
}
