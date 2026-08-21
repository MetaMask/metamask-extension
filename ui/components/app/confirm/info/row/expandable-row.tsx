import React, { useLayoutEffect, useRef, useState } from 'react';
import classnames from 'clsx';
import { Box } from '@metamask/design-system-react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';
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

  const ref = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const { value: expanded, toggle } = useBoolean(startExpanded);

  // The expanded height cannot be read during render, so it is measured after
  // layout and kept in state. It is re-measured whenever the content resizes.
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined,
  );

  useLayoutEffect(() => {
    const container = ref.current;

    if (!container) {
      return undefined;
    }

    const measure = () => setContentHeight(container.scrollHeight);

    measure();

    if (typeof ResizeObserver === 'undefined' || !contentRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ConfirmInfoRow {...rowProps}>
        <Box className="flex">
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
          height: expanded ? contentHeight : '0px',
        }}
      >
        {
          // Negate the margin of the above expandable row.
          // Not an issue with sequential rows due to margin collapse.
        }
        <Box ref={contentRef} style={{ marginTop: '-8px' }}>
          {content}
        </Box>
      </Box>
    </>
  );
};
