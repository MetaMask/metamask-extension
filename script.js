const fs = require('fs');
const path = require('path');
const glob = require('glob');

const getStoryName = (id) => {
  const parts = id.split('--');
  return parts[1];
};

const updateMDXContent = (content) => {
  const storyRegex = /<Canvas>\s*<Story id="([\w-]+)" \/\>\s*<\/Canvas>/g;
  return content.replace(storyRegex, (_, id) => {
    const storyName = getStoryName(id);
    const storyImportName =
      storyName.charAt(0).toUpperCase() + storyName.slice(1) + 'Story';
    return `<Canvas of={ModalStories.${storyImportName}} />`;
  });
};

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

        const updatedContent = updateMDXContent(data);
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
const mdxFilesPattern = path.join(
  __dirname,
  'ui/components/component-library',
  '**',
  '*.mdx',
);
processMDXFiles(mdxFilesPattern);
