import React, { useState } from 'react';
import { readPartitionsFile } from '../../common/partitions-file';
import type { ModulePartitionChild } from '../../common/build-module-partitions';
import Box from './Box';
import Connections from './Connections';
import type { BoxRect, BoxModel } from './types';

type Summary = {
  numConvertedModules: number;
  numModules: number;
};

function calculatePercentageComplete(summary: Summary) {
  return ((summary.numConvertedModules / summary.numModules) * 100).toFixed(1);
}

const partitions = readPartitionsFile();
const allModules = partitions.flatMap((partition) => {
  return partition.children;
});
const modulesById = allModules.reduce<Record<string, ModulePartitionChild>>(
  (obj, module) => {
    return { ...obj, [module.id]: module };
  },
  {},
);
const overallTotal = {
  numConvertedModules: allModules.filter((module) => module.hasBeenConverted)
    .length,
  numModules: allModules.length,
};

export default function App() {
  const [boxRectsByModuleId, setBoxRectsById] = useState<Record<
    string,
    BoxRect
  > | null>(null);
  const boxesByModuleId =
    boxRectsByModuleId === null
      ? {}
      : Object.values(boxRectsByModuleId).reduce<Record<string, BoxModel>>(
          (obj, boxRect) => {
            const module = modulesById[boxRect.moduleId];

            const dependencyBoxRects = module.dependencyIds.reduce<BoxRect[]>(
              (dependencyBoxes, dependencyId) => {
                if (boxRectsByModuleId[dependencyId] === undefined) {
                  return dependencyBoxes;
                }
                return [...dependencyBoxes, boxRectsByModuleId[dependencyId]];
              },
              [],
            );

            const dependentBoxRects = module.dependentIds.reduce<BoxRect[]>(
              (dependentBoxes, dependentId) => {
                if (boxRectsByModuleId[dependentId] === undefined) {
                  return dependentBoxes;
                }
                return [...dependentBoxes, boxRectsByModuleId[dependentId]];
              },
              [],
            );

            return {
              ...obj,
              [boxRect.moduleId]: {
                rect: boxRect,
                dependencyBoxRects,
                dependentBoxRects,
              },
            };
          },
          {},
        );
  const [activeBoxRectId, setActiveBoxRectId] = useState<string | null>(null);
  const activeBoxRect =
    boxRectsByModuleId === null || activeBoxRectId === null
      ? null
      : boxRectsByModuleId[activeBoxRectId];

  const registerBox = (id: string, boxRect: BoxRect) => {
    setBoxRectsById((existingBoxRectsById) => {
      if (existingBoxRectsById === undefined) {
        return { [id]: boxRect };
      }
      return { ...existingBoxRectsById, [id]: boxRect };
    });
  };
  const toggleConnectionsFor = (id: string) => {
    if (activeBoxRectId !== undefined && activeBoxRectId === id) {
      setActiveBoxRectId(null);
    } else {
      setActiveBoxRectId(id);
    }
  };

  return (
    <>
      <h1 className="page-header">
        <img src="images/metamask-fox.svg" className="page-header__icon" />
        Extension TypeScript Migration Status
      </h1>
      <h2
        className="overall-summary"
        style={{
          '--progress': `${calculatePercentageComplete(overallTotal)}%`,
        }}
      >
        OVERALL: {overallTotal.numConvertedModules}/{overallTotal.numModules} (
        {calculatePercentageComplete(overallTotal)}%)
      </h2>
      <details className="help">
        <summary className="help__question">What is this?</summary>
        <div className="help__answer">
          <p>
            This is a dashboard that tracks the status of converting the
            extension codebase from JavaScript to TypeScript. It is updated
            whenever a new commit is pushed to the codebase, so it always
            represents the current work.
          </p>

          <p>
            Each box on this page represents a file in the codebase. Gray boxes
            <span className="module module--inline module--to-be-converted">
              &nbsp;
            </span>
            represent files that need to be converted to TypeScript. Green boxes
            <span className="module module--inline module--has-been-converted">
              &nbsp;
            </span>
            are files that have already been converted. Faded boxes
            <span className="module module--inline module--to-be-converted module--test">
              &nbsp;
            </span>
            <span
              className="module module--inline module--has-been-converted module--test"
              style={{ marginLeft: 0 }}
            >
              &nbsp;
            </span>
            are test or Storybook files.
          </p>

          <p>
            You can hover over a box to see the name of the file that it
            represents. You can also click on a box to see connections between
            other files;{' '}
            <strong className="module-connection__dependency">red</strong> lines
            lead to dependencies (other files that import the file);{' '}
            <strong className="module-connection__dependent">blue</strong> lines
            lead to dependents (other files that are imported by the file).
          </p>

          <p>
            These boxes are further partitioned by <em>level</em>. The level of
            a file is how many files you have to import before you reach that
            file in the whole codebase. For instance, if we have a file{' '}
            <code>foo.js</code>, and that file imports <code>bar.js</code> and{' '}
            <code>baz.js</code>, and <code>baz.js</code> imports{' '}
            <code>qux.js</code>, then:
          </p>

          <ul>
            <li>
              <code>foo.js</code> would be at <em>level 1</em>
            </li>
            <li>
              <code>bar.js</code> and <code>baz.js</code> would be at{' '}
              <em>level 2</em>
            </li>
            <li>
              <code>qux.js</code> would be at <em>level 3</em>
            </li>
          </ul>

          <p>
            This level assignment can be used to determine a priority for
            converting the remaining JavaScript files. Files which have fewer
            dependencies should in theory be easier to convert, so files with a
            higher level should be converted first. In other words,{' '}
            <strong>
              you should be able to start from the top and go down
            </strong>
            .
          </p>
        </div>
      </details>
      <div className="partitions">
        {partitions.map((partition) => {
          return (
            <div key={partition.level} className="partition">
              <div className="partition__name">level {partition.level}</div>
              <div className="partition__children">
                {partition.children.map((module) => {
                  const areConnectionsVisible = activeBoxRectId === module.id;
                  return (
                    <Box
                      key={module.id}
                      module={module}
                      register={registerBox}
                      toggleConnectionsFor={toggleConnectionsFor}
                      areConnectionsVisible={areConnectionsVisible}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        {activeBoxRect === null ? null : (
          <Connections activeBox={boxesByModuleId[activeBoxRect.moduleId]} />
        )}
      </div>
    </>
  );
}
