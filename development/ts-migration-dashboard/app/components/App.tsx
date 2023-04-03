import React from 'react';
import classnames from 'classnames';
import { Tooltip as ReactTippy } from 'react-tippy';
import { readPartitionsFile } from '../../common/partitions-file';

type Summary = {
  numConvertedModules: number;
  numModules: number;
};

function calculatePercentageComplete(summary: Summary) {
  return ((summary.numConvertedModules / summary.numModules) * 100).toFixed(1);
}

export default function App() {
  const partitions = readPartitionsFile();

  const allModules = partitions.flatMap((partition) => {
    return partition.children;
  });
  const overallTotal = {
    numConvertedModules: allModules.filter((module) => module.hasBeenConverted)
      .length,
    numModules: allModules.length,
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
            Each box
            <div className="module module--inline module--to-be-converted">
              &nbsp;
            </div>
            on this page represents a file that either we want to convert or
            we've already converted to TypeScript (hover over a box to see the
            filename). Boxes that are
            <div className="module module--inline module--to-be-converted module--test">
              &nbsp;
            </div>
            greyed out are test or Storybook files.
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
                {partition.children.map(({ name, hasBeenConverted }) => {
                  const isTest = /\.test\.(?:js|tsx?)/u.test(name);
                  const isStorybookModule = /\.stories\.(?:js|tsx?)/u.test(
                    name,
                  );
                  return (
                    <ReactTippy
                      key={name}
                      title={name}
                      arrow={true}
                      animation="fade"
                      duration={250}
                      className="module__tooltipped"
                      style={{ display: 'block' }}
                    >
                      <div
                        className={classnames('module', {
                          'module--has-been-converted': hasBeenConverted,
                          'module--to-be-converted': !hasBeenConverted,
                          'module--test': isTest,
                          'module--storybook': isStorybookModule,
                        })}
                      />
                    </ReactTippy>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
