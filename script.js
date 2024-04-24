const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to convert kebab-case to CamelCase
const toCamelCase = (str) => {
  return str.replace(/-./g, (x) => x[1].toUpperCase());
};

// Function to format story names from story ID
const formatStoryName = (storyId) => {
  const [componentPath, storyName] = storyId.split('--');
  const componentName = componentPath.split('-').map(toCamelCase).join('');
  const formattedStoryName =
    storyName.charAt(0).toUpperCase() +
    storyName.slice(1).replace(/-\w/g, (m) => m[1].toUpperCase());
  return `${componentName}Stories.${formattedStoryName}`;
};

// Update the import statements in the content
const updateImports = (content) => {
  // Adjust imports for Stories
  content = content.replace(
    /import { Story, Canvas, ArgTypes } from '@storybook\/addon-docs';\s*import { ([\w, ]+) } from '(\.\/[\w-]+)';/g,
    (match, components, path) => {
      const componentName = components.split(', ')[0]; // Assuming the first import is the main component
      const storiesName = `${toCamelCase(componentName)}Stories`;
      const storiesPath = `${path}.stories`;
      return `import { Controls, Canvas } from '@storybook/addon-docs';\nimport * as ${storiesName} from '${storiesPath}';`;
    },
  );
  return content;
};

// Update Story references within the content
const updateStoryReferences = (content) => {
  return content.replace(
    /<Canvas>\s*<Story id="([\w-]+--[\w-]+)" \/>/g,
    (match, storyId) => {
      const formattedReference = formatStoryName(storyId);
      return `<Canvas of={${formattedReference}} />`;
    },
  );
};

// Process MDX files found by the glob pattern
const processMDXFiles = (pattern) => {
  glob(pattern, (err, files) => {
    if (err) {
      console.error('Error finding MDX files:', err);
      return;
    }

    files.forEach((file) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        let updatedContent = updateImports(data);
        updatedContent = updateStoryReferences(updatedContent);

        fs.writeFile(file, updatedContent, 'utf8', (err) => {
          if (err) {
            console.error(`Error writing file ${file}:`, err);
            return;
          }
          console.log(`Updated ${file}`);
        });
      });
    });
  });
};

// Define the pattern to find MDX files
const mdxFilesPattern = path.join(__dirname, 'ui', '**', '*.mdx');
processMDXFiles(mdxFilesPattern);
