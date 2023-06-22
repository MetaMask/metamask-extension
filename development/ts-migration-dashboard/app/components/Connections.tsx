import React from 'react';
import type { BoxModel } from './types';

function buildShapePoints(coordinates: [number, number][]): string {
  return coordinates.map(([x, y]) => `${x},${y}`).join(' ');
}

function buildPathD(coordinates: [number, number][]): string {
  return coordinates
    .map(([x, y], index) => {
      if (index === 0) {
        return `M ${x},${y}`;
      }
      return `L ${x},${y}`;
    })
    .join(' ');
}

function Arrowhead({
  type,
  x,
  y,
}: {
  type: 'dependency' | 'dependent';
  x: number;
  y: number;
}) {
  return (
    <polygon
      className={`module-connection__${type}-arrowhead`}
      points={buildShapePoints([
        [x - 6, y - 6],
        [x + 6, y - 6],
        [x, y],
      ])}
    />
  );
}

function Line({
  type,
  originX,
  originY,
  originYOffset = 0,
  destinationX,
  destinationY,
  destinationYOffset = 0,
}: {
  type: 'dependency' | 'dependent';
  originX: number;
  originY: number;
  originYOffset?: number;
  destinationX: number;
  destinationY: number;
  destinationYOffset?: number;
}) {
  const coordinates: [number, number][] =
    type === 'dependency'
      ? [
          [originX, originY],
          [originX, originY + originYOffset],
          [destinationX, originY + originYOffset],
          [destinationX, destinationY],
        ]
      : [
          [originX, originY],
          [originX, destinationY - destinationYOffset],
          [destinationX, destinationY - destinationYOffset],
          [destinationX, destinationY],
        ];
  return (
    <path
      className={`module-connection__${type}`}
      d={buildPathD(coordinates)}
    />
  );
}

function LineStart({
  type,
  x,
  y,
}: {
  type: 'dependency' | 'dependent';
  x: number;
  y: number;
}) {
  return (
    <circle className={`module-connection__${type}-point`} cx={x} cy={y} />
  );
}

export default function Connections({ activeBox }: { activeBox: BoxModel }) {
  return (
    <svg className="module-connections">
      {activeBox.dependencyBoxRects.length === 0 ? null : (
        <Arrowhead
          type="dependency"
          x={activeBox.rect.centerX}
          y={activeBox.rect.centerY}
        />
      )}
      {activeBox.dependencyBoxRects.map((dependencyBoxRect) => {
        return (
          <React.Fragment key={dependencyBoxRect.moduleId}>
            <Line
              type="dependency"
              originX={dependencyBoxRect.centerX}
              originY={dependencyBoxRect.centerY}
              originYOffset={dependencyBoxRect.height / 2 + 7}
              destinationX={activeBox.rect.centerX}
              destinationY={activeBox.rect.centerY}
            />
            <LineStart
              type="dependency"
              x={dependencyBoxRect.centerX}
              y={dependencyBoxRect.centerY}
            />
          </React.Fragment>
        );
      })}
      {activeBox.dependentBoxRects.map((dependentBoxRect) => {
        return (
          <React.Fragment key={dependentBoxRect.moduleId}>
            <Line
              type="dependent"
              originX={activeBox.rect.centerX}
              originY={activeBox.rect.centerY}
              destinationX={dependentBoxRect.centerX}
              destinationY={dependentBoxRect.centerY}
              destinationYOffset={dependentBoxRect.height / 2 + 7}
            />
            <Arrowhead
              type="dependent"
              x={dependentBoxRect.centerX}
              y={dependentBoxRect.centerY}
            />
          </React.Fragment>
        );
      })}
    </svg>
  );
}
