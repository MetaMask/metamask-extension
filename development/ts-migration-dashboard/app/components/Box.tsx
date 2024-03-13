import React, { useCallback, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { Tooltip as ReactTippy } from 'react-tippy';
import type { ModulePartitionChild } from '../../common/build-module-partitions';
import type { BoxRect } from './types';

export default function Box({
  module,
  register,
  toggleConnectionsFor,
  areConnectionsVisible,
  isSearchHighlighted,
}: {
  module: ModulePartitionChild;
  register: (id: string, boxRect: BoxRect) => void;
  toggleConnectionsFor: (id: string) => void;
  areConnectionsVisible: boolean;
  isSearchHighlighted: boolean;
}) {
  const isTest = /\.test\.[jt]sx?$/u.test(module.id);
  const isStorybookModule = /\.stories\.[jt]sx$/u.test(module.id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.offsetParent) {
      const rect = ref.current.getBoundingClientRect();
      const offsetParentRect = ref.current.offsetParent.getBoundingClientRect();
      const top = rect.top - offsetParentRect.top;
      const left = rect.left - offsetParentRect.left;
      const centerX = left + rect.width / 2;
      const centerY = top + rect.height / 2;
      register(module.id, {
        moduleId: module.id,
        top,
        left,
        width: rect.width,
        height: rect.height,
        centerX,
        centerY,
      });
    }
  }, [ref, module, register]);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      toggleConnectionsFor(module.id);
    },
    [toggleConnectionsFor, module],
  );

  return (
    <ReactTippy
      title={module.id}
      arrow={true}
      animation="fade"
      duration={250}
      className="module__tooltipped"
      style={{ display: 'block' }}
    >
      <div
        ref={ref}
        onClick={onClick}
        className={classnames('module', {
          'module--was-originally-in-ts': module.wasOriginallyInTypeScript,
          'module--should-be-converted-to-ts':
            module.shouldBeConvertedToTypeScript,
          'module--has-been-converted-to-ts':
            module.hasBeenConvertedToTypeScript,
          'module--test': isTest,
          'module--storybook': isStorybookModule,
          'module--active': areConnectionsVisible,
          'module--search-highlighted': isSearchHighlighted,
        })}
      />
    </ReactTippy>
  );
}
