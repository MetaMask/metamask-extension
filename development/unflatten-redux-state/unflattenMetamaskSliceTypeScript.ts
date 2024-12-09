import * as fs from 'fs';
import * as ts from 'typescript';
const { STATE_PROPERTIES_TO_CONTROLLER_MAP } = require('./constants');

function unflattenMetamaskObject(sourceCode: string): string {
  const filePath = 'tempFile.ts'; // Define filePath or pass it as a parameter
  const source = ts.createSourceFile(
    'tempFile.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const transformer =
    <T extends ts.Node>(context: ts.TransformationContext) =>
    (rootNode: T) => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isObjectLiteralExpression(node)) {
          const metamaskProperty = node.properties.find(
            (prop): prop is ts.PropertyAssignment =>
              ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              prop.name.text === 'metamask',
          );

          if (metamaskProperty && ts.isPropertyAssignment(metamaskProperty)) {
            const newProperties: ts.ObjectLiteralElementLike[] = [];

            if (ts.isObjectLiteralExpression(metamaskProperty.initializer)) {
              metamaskProperty.initializer.properties.forEach((prop) => {
                if (
                  ts.isPropertyAssignment(prop) &&
                  ts.isIdentifier(prop.name)
                ) {
                  const controllerName =
                    STATE_PROPERTIES_TO_CONTROLLER_MAP[
                      prop.name
                        .text as keyof typeof STATE_PROPERTIES_TO_CONTROLLER_MAP
                    ];
                  if (controllerName) {
                    const existingController = newProperties.find(
                      (p) =>
                        ts.isPropertyAssignment(p) &&
                        ts.isIdentifier(p.name) &&
                        p.name.text === controllerName,
                    );

                    if (
                      existingController &&
                      ts.isPropertyAssignment(existingController)
                    ) {
                      if (
                        ts.isObjectLiteralExpression(
                          existingController.initializer,
                        )
                      ) {
                        existingController.initializer.properties.concat(prop);
                      }
                    } else {
                      newProperties.push(
                        ts.factory.createPropertyAssignment(
                          ts.factory.createIdentifier(controllerName),
                          ts.factory.createObjectLiteralExpression(
                            [prop],
                            true,
                          ),
                        ),
                      );
                    }
                  } else {
                    newProperties.push(prop);
                  }
                }
              });
            }

            return ts.factory.updateObjectLiteralExpression(
              node,
              newProperties,
            );
          }
        }
        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(rootNode, visit);
    };

  const result = ts.transform(source, [transformer]);
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });
  const transformedSourceFile = result.transformed[0] as ts.SourceFile;
  const transformedCode = printer.printFile(transformedSourceFile);
  return transformedCode;
}

function processFile(filePath: string) {
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  const transformedCode = unflattenMetamaskObject(sourceCode);
  console.log(transformedCode);
  fs.writeFileSync(filePath, transformedCode, { encoding: 'utf8' });
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (filePath) {
    processFile(filePath);
  } else {
    console.error('No file path provided.');
  }
}

module.exports = processFile;
