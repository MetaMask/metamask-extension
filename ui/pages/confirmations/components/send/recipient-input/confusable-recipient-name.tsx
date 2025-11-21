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
        splits.push({ str: to.slice(prevIndex, confusableSlice.index) });
      }
      splits.push({
        str: confusableSlice.confusable.point,
        confusable: confusableSlice.confusable,
      });
      prevIndex =
        confusableSlice.index + confusableSlice.confusable.point.length;
    }
    splits.push({ str: to.slice(prevIndex) });
    return splits;
  }, [to, confusableCharacters]);

  return nameSplits ? (
    <Box display={Display.Flex}>
      {nameSplits.map((split, index) => {
        if (split.confusable) {
          return (
            <Tooltip
              key={index}
              position="top"
              html={
                <Text>
                  {t('confusableCharacterTooltip', [
                    <Box
                      key={`${split.str}-${split.confusable.point}`}
                      className="confusable-character"
                    >
                      {` ‘${split.confusable.point}’ `}
                    </Box>,
                    <Box
                      key={`${split.str}-${split.confusable.similarTo}`}
                      className="confusable-character"
                    >
                      {` ‘${split.confusable.similarTo}’`}.
                    </Box>,
                  ])}
                </Text>
              }
              trigger="mouseenter"
            >
              <Text
                color={TextColor.warningDefault}
                variant={TextVariant.bodyMd}
              >
                {split.str}
              </Text>
            </Tooltip>
          );
        }
        return (
          <Text key={index} variant={TextVariant.bodyMd}>
            {split.str}
          </Text>
        );
      })}
    </Box>
  ) : null;
};
