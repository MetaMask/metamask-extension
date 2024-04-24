const fs = require('fs');
const path = require('path');
const glob = require('glob');

const updateImports = (content) => {
  // Replace the Storybook docs imports
  content = content.replace(
    /import { Story, Canvas, ArgTypes } from '@storybook\/addon-docs';/g,
    "import { Controls, Canvas } from '@storybook/addon-docs';",
  );

  // Find component imports and convert to Stories import
  content = content.replace(
    /import { ([\w, ]+) } from '(\.\/[\w-]+)';/g,
    (match, components, path) => {
      // Create a modified import statement for the stories
      const storiesPath = `${path}.stories`;
      return `import * as ${components.trim()}Stories from '${storiesPath}';`;
    },
  );

  return content;
};

const updateStoryReferences = (content) => {
  const storyRegex = /<Canvas>\s*<Story id="([\w-]+)" \/\>\s*<\/Canvas>/g;
  return content.replace(storyRegex, (_, id) => {
    const parts = id.split('--');
    const storyComponent =
      parts[0].split('-').map(capitalize).join('') + 'Stories';
    const storyName =
      parts[1].charAt(0).toUpperCase() + parts[1].slice(1) + 'Story';
    return `<Canvas of={${storyComponent}.${storyName}} />`;
  });
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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

// Update the directory path as needed
const mdxFilesPattern = path.join(__dirname, 'ui', '**', '*.mdx');
processMDXFiles(mdxFilesPattern);
