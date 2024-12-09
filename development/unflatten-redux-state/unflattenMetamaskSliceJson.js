const fs = require('fs');
const { STATE_PROPERTIES_TO_CONTROLLER_MAP } = require('./constants');

function unflattenMetamask(inputFilePath) {
  const data = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
  const { metamask } = data;
  const unflattened = {};

  for (const [key, value] of Object.entries(metamask)) {
    const controller = STATE_PROPERTIES_TO_CONTROLLER_MAP[key];
    if (controller) {
      if (!unflattened[controller]) {
        unflattened[controller] = {};
      }
      unflattened[controller][key] = value;
    } else {
      console.warn(`No controller found for key: ${key}`);
    }
  }

  data.metamask = unflattened;
  console.log(data);
  fs.writeFileSync(inputFilePath, JSON.stringify(data, null, 2));
}

if (require.main === module) {
  const inputFilePath = process.argv[2];
  if (inputFilePath) {
    unflattenMetamask(inputFilePath);
  } else {
    console.error('No input file path provided.');
  }
}
