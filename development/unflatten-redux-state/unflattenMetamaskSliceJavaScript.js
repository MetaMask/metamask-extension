const fs = require('fs');
const acorn = require('acorn');
const estraverse = require('estraverse');
const escodegen = require('escodegen');
const { STATE_PROPERTIES_TO_CONTROLLER_MAP } = require('./constants');

function unflattenMetamaskCode(inputFilePath) {
  const code = fs.readFileSync(inputFilePath, 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'module' });

  estraverse.replace(ast, {
    enter(node) {
      if (
        node.type === 'ObjectExpression' &&
        node.properties.some((prop) => prop.key && prop.key.name === 'metamask')
      ) {
        const metamaskProperty = node.properties.find(
          (prop) => prop.key.name === 'metamask',
        );
        if (
          metamaskProperty &&
          metamaskProperty.value.type === 'ObjectExpression'
        ) {
          const unflattened = {};
          metamaskProperty.value.properties.forEach((prop) => {
            const key = prop.key.name;
            const controller = STATE_PROPERTIES_TO_CONTROLLER_MAP[key];
            if (controller) {
              if (!unflattened[controller]) {
                unflattened[controller] = [];
              }
              unflattened[controller].push(prop);
            } else {
              console.warn(`No controller found for key: ${key}`);
              if (!unflattened[key]) {
                unflattened[key] = [];
              }
              unflattened[key].push(prop); // Keep the property as is if no controller is found
            }
          });

          metamaskProperty.value.properties = Object.entries(unflattened).map(
            ([controller, props]) => ({
              type: 'Property',
              key: { type: 'Identifier', name: controller },
              value: { type: 'ObjectExpression', properties: props },
              kind: 'init',
              method: false,
              shorthand: false,
              computed: false,
            }),
          );
        }
      }
    },
  });

  const transformedCode = escodegen.generate(ast, { comment: true });
  console.log(transformedCode);
  fs.writeFileSync(inputFilePath, transformedCode, { encoding: 'utf8' });
}

if (require.main === module) {
  const inputFilePath = process.argv[2];
  if (inputFilePath) {
    unflattenMetamaskCode(inputFilePath);
  } else {
    console.error('No input file path provided.');
  }
}
