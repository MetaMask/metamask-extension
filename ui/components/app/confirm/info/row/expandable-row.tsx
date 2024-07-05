import React, { useCallback, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import {
  Display,
  IconColor,
} from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRow, ConfirmInfoRowProps } from './row';

export type ConfirmInfoExpandableRowProps = ConfirmInfoRowProps & {
  content: React.ReactNode | string;
  startExpanded?: boolean;
};

export const ConfirmInfoExpandableRow = (
  props: ConfirmInfoExpandableRowProps,
) => {
  const { content, children, startExpanded, ...rowProps } = props;

  const ref = useRef() as React.MutableRefObject<HTMLSpanElement | null>;

  const [expanded, setExpanded] = useState<boolean>(Boolean(startExpanded));
  const [, setLoaded] = useState<boolean>(false);

  const handleClick = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // Required to force a re-render so the content height can be calculated.
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      <ConfirmInfoRow {...rowProps}>
        <Box display={Display.Flex}>
          {children}
          <ButtonIcon
            marginLeft={1}
            className={classnames({
              expandIcon: true,
              expanded,
            })}
            iconName={IconName.ArrowLeft}
            color={IconColor.primaryDefault}
            size={ButtonIconSize.Sm}
            onClick={handleClick}
            ariaLabel="expand"
          />
        </Box>
      </ConfirmInfoRow>
      <Box
        ref={ref}
        className="expandable"
        style={{
          height: expanded ? ref.current?.scrollHeight : '0px',
        }}
      >
        {
          // Negate the margin of the above expandable row.
          // Not an issue with sequential rows due to margin collapse.
        }
        <Box style={{ marginTop: '-8px' }}>{content}</Box>
      </Box>
    </>
  );
};
