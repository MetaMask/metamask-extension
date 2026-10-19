import React, { useMemo } from 'react';

import { Box, Text } from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendContext } from '../../../context/send';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import Tooltip from '../../../../../components/ui/tooltip';
import { getUniqueKeys } from '../../../../../helpers/utils/unique-keys';

type Confusable = {
  point: string;
  similarTo: string;
};

function findAllIndexesOfConfusable(str: string, confusable: Confusable) {
  const indexes = [];
  let i = str.indexOf(confusable.point);
  while (i !== -1) {
    indexes.push({ index: i, confusable });
    i = str.indexOf(confusable.point, i + 1);
  }
  return indexes;
}

export const ConfusableRecipientName = ({
  confusableCharacters,
}: {
  confusableCharacters: Confusable[];
}) => {
  const t = useI18nContext();
  const { to } = useSendContext();

  const nameSplits = useMemo(() => {
    if (!to) {
      return null;
    }
    const confusableList = confusableCharacters.flatMap((confusable) =>
      findAllIndexesOfConfusable(to, confusable),
    );

    const splits = [];
    let prevIndex = 0;
    for (const confusableSlice of confusableList) {
      if (prevIndex !== confusableSlice.index) {
        splits.push({
          str: to.slice(prevIndex, confusableSlice.index),
          start: prevIndex,
        });
      }
      splits.push({
        str: confusableSlice.confusable.point,
        start: confusableSlice.index,
        confusable: confusableSlice.confusable,
      });
      prevIndex =
        confusableSlice.index + confusableSlice.confusable.point.length;
    }
    splits.push({ str: to.slice(prevIndex), start: prevIndex });
    return splits;
  }, [to, confusableCharacters]);

  const splitKeys = useMemo(
    () =>
      getUniqueKeys(nameSplits ?? [], (split) => `${split.start}-${split.str}`),
    [nameSplits],
  );

  return nameSplits ? (
    <Box display={Display.Inline} className="break-all">
      {nameSplits.map((split, index) => {
        if (split.confusable) {
          return (
            <Tooltip
              key={splitKeys[index]}
              position="top"
              tag="span"
              html={
                <Text>
                  {t('confusableCharacterTooltip', [
                    <Box
                      key={`${split.str}-${split.confusable.point}`}
                      className="confusable-character"
                    >
                      {` '${split.confusable.point}' `}
                    </Box>,
                    <Box
                      key={`${split.str}-${split.confusable.similarTo}`}
                      className="confusable-character"
                    >
                      {` '${split.confusable.similarTo}'`}.
                    </Box>,
                  ])}
                </Text>
              }
              trigger="mouseenter"
            >
              <Text
                as="span"
                color={TextColor.warningDefault}
                variant={TextVariant.bodyMd}
              >
                {split.str}
              </Text>
            </Tooltip>
          );
        }
        return (
          <Text key={splitKeys[index]} as="span" variant={TextVariant.bodyMd}>
            {split.str}
          </Text>
        );
      })}
    </Box>
  ) : null;
};
