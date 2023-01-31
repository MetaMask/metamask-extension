import React from 'react';
import classnames from 'classnames';
import { Tooltip as ReactTippy } from 'react-tippy';
import { ModulePartition } from '../scripts/build-module-partitions';

// The `brfs` transform for browserify calls `fs.readLineSync` and
// `path.resolve` at build time and inlines file contents into the source code.
// To accomplish this we have to bring in `fs` and `path` using `require` and
// not `import`. This is weird in a TypeScript file, and typescript-eslint
// (rightly) complains about this, but it's actually okay because the above
// `import` lines will actually get turned into `require`s anyway before passing
// through the rest of browserify. However, `brfs` should handle this. There is
// an active bug for this, but there isn't a known workaround yet:
// <https://github.com/browserify/brfs/issues/39>
/* eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
const fs = require('fs');
/* eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */
const path = require('path');

type Summary = {
  numConvertedFiles: number;
  numFiles: number;
};

function calculatePercentageComplete(summary: Summary) {
  return ((summary.numConvertedFiles / summary.numFiles) * 100).toFixed(1);
}

export default function App() {
  const partitions = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../intermediate/partitions.json'),
      {
        encoding: 'utf-8',
      },
    ),
  ) as ModulePartition[];

  const allFiles = partitions.flatMap((partition) => {
    return partition.children;
  });
  const overallTotal = {
    numConvertedFiles: allFiles.filter((file) => file.hasBeenConverted).length,
    numFiles: allFiles.length,
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
        OVERALL: {overallTotal.numConvertedFiles}/{overallTotal.numFiles} (
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
            <div className="file file--inline file--to-be-converted">
              &nbsp;
            </div>
            on this page represents a file that either we want to convert or
            we've already converted to TypeScript (hover over a box to see the
            filename). Boxes that are
            <div className="file file--inline file--to-be-converted file--test">
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
      <div className="levels">
        {partitions.map((partition) => {
          return (
            <div key={partition.level} className="level">
              <div className="level__name">level {partition.level}</div>
              <div className="level__children">
                {partition.children.map(({ name, hasBeenConverted }) => {
                  const isTest = /\.test\.(?:js|tsx?)/u.test(name);
                  const isStorybookFile = /\.stories\.(?:js|tsx?)/u.test(name);
                  return (
                    <ReactTippy
                      key={name}
                      title={name}
                      arrow={true}
                      animation="fade"
                      duration={250}
                      className="file__tooltipped"
                      style={{ display: 'block' }}
                    >
                      <div
                        className={classnames('file', {
                          'file--has-been-converted': hasBeenConverted,
                          'file--to-be-converted': !hasBeenConverted,
                          'file--test': isTest,
                          'file--storybook': isStorybookFile,
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
