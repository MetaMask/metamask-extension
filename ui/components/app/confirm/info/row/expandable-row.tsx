import React, { useEffect, useRef, useState } from 'react';
import classnames from 'clsx';
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
import { useBoolean } from '../../../../../hooks/useBoolean';
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

  const { value: expanded, toggle } = useBoolean(startExpanded);
  const [, setLoaded] = useState<boolean>(false);

  // Required to force a re-render so the content height can be calculated.
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      <ConfirmInfoRow {...rowProps}>
        <Box display={Display.Flex}>
          <ButtonIcon
            marginLeft={1}
            className={classnames({
              expandIcon: true,
              expanded,
            })}
            iconName={IconName.ArrowDown}
            color={IconColor.primaryDefault}
            size={ButtonIconSize.Sm}
            onClick={toggle}
            ariaLabel="expand"
          />
          {children}
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
