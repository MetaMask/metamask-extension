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

  const { value: expanded, toggle } = useBoolean(startExpanded);
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return undefined;
    }

    const updateHeight = () => {
      setContentHeight(node.scrollHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, [expanded, content]);

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
        ref={contentRef}
        className="expandable"
        style={{
          height: expanded ? contentHeight : '0px',
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
