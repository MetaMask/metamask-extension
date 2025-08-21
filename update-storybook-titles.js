#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function toPascalCase(str) {
  // Special case for "ui" -> "UI"
  if (str.toLowerCase() === 'ui') {
    return 'UI';
  }
  
  // If the string is already in PascalCase and contains no separators, return as-is
  if (!/[-_]/.test(str) && /^[A-Z][a-zA-Z0-9]*$/.test(str)) {
    return str;
  }
  
  return str
    .split(/[-_]/)
    .map(word => {
      // Keep common acronyms in all caps
      const upperWord = word.toUpperCase();
      if (['SRP', 'NFT', 'API', 'URL', 'UI', 'QR', 'ETH', 'ERC', 'JSON', 'HTML', 'CSS', 'JS', 'TS', 'ID'].includes(upperWord)) {
        return upperWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

function extractComponentName(content) {
  // Look for component: ComponentName in the export default block
  const componentMatch = content.match(/component:\s*([A-Za-z][A-Za-z0-9]*)/);
  if (componentMatch) {
    return componentMatch[1];
  }
  
  // Fallback: look for import statements to find the main component
  const importMatches = content.match(/import\s+([A-Za-z][A-Za-z0-9]*)\s+from/g);
  if (importMatches && importMatches.length > 0) {
    // Get the last import (usually the main component)
    const lastImport = importMatches[importMatches.length - 1];
    const nameMatch = lastImport.match(/import\s+([A-Za-z][A-Za-z0-9]*)/);
    if (nameMatch) {
      return nameMatch[1];
    }
  }
  
  return null;
}

function isDeprecated(content) {
  // Check for common deprecation indicators
  return /deprecated/i.test(content) || 
         /\@deprecated/i.test(content) ||
         content.includes('(deprecated)');
}

function generateTitleFromPath(filePath, content) {
  // Normalize the path to handle both relative and absolute paths
  let normalizedPath = filePath;
  
  // If path starts with 'ui/', treat it as already relative to project root
  if (filePath.startsWith('ui/')) {
    normalizedPath = '/' + filePath; // Add leading slash for indexOf to work
  }
  
  // Find the ui/ directory and get the path after it
  const uiIndex = normalizedPath.indexOf('/ui/');
  if (uiIndex === -1) {
    throw new Error(`Path does not contain /ui/: ${filePath}`);
  }
  
  const relativePath = normalizedPath.substring(uiIndex + 4); // +4 to skip "/ui/"
  const pathParts = path.dirname(relativePath).split('/');
  
  // Convert each part to PascalCase
  const titleParts = pathParts.map(part => toPascalCase(part));
  
  // Extract the actual component name from the file content
  let componentName = extractComponentName(content);
  
  // Fallback to filename if component name not found
  if (!componentName) {
    const filename = path.basename(filePath);
    const baseFilename = filename.replace(/\.stories\.(js|tsx)$/, '');
    componentName = toPascalCase(baseFilename);
  }
  
  // The component name should replace the last directory part if the directory 
  // name matches the component (accounting for case conversion)
  const lastDirPart = titleParts[titleParts.length - 1];
  const lastDirOriginal = pathParts[pathParts.length - 1];
  const filename = path.basename(filePath).replace(/\.stories\.(js|tsx)$/, '');
  
  let finalTitle;
  if (lastDirOriginal === filename || lastDirPart.toLowerCase() === componentName.toLowerCase()) {
    finalTitle = titleParts.join('/');
  } else {
    finalTitle = [...titleParts, componentName].join('/');
  }
  
  // Add deprecated suffix if component is deprecated
  if (isDeprecated(content)) {
    finalTitle += ' (deprecated)';
  }
  
  return finalTitle;
}

function updateStoryTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newTitle = generateTitleFromPath(filePath, content);
    
    let updatedContent = content;
    let titleFound = false;
    
    // Pattern 1: export default { title: '...' }
    const exportDefaultRegex = /(export\s+default\s*\{[^}]*?title:\s*['"`])([^'"`]+)(['"`])/s;
    
    // Pattern 2: const meta: Meta<...> = { title: '...' }
    const metaRegex = /(const\s+meta[^=]*=\s*\{[^}]*?title:\s*['"`])([^'"`]+)(['"`])/s;
    
    // Pattern 3: const SomeStory = { title: '...' }
    const constStoryRegex = /(const\s+[A-Za-z][A-Za-z0-9]*\s*=\s*\{[^}]*?title:\s*['"`])([^'"`]+)(['"`])/s;
    
    // Pattern 4: Simple title property at start of line (with context checking)
    const simpleTitleRegex = /^(\s*title:\s*['"`])([^'"`]+)(['"`])/m;
    
    if (exportDefaultRegex.test(content)) {
      updatedContent = content.replace(exportDefaultRegex, `$1${newTitle}$3`);
      titleFound = true;
    } else if (metaRegex.test(content)) {
      updatedContent = content.replace(metaRegex, `$1${newTitle}$3`);
      titleFound = true;
    } else if (constStoryRegex.test(content)) {
      updatedContent = content.replace(constStoryRegex, `$1${newTitle}$3`);
      titleFound = true;
    } else if (simpleTitleRegex.test(content)) {
      // For simple title regex, check context to make sure we're not in args
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (simpleTitleRegex.test(lines[i])) {
          // Check if we're in the main meta object or export default block
          let inMainBlock = false;
          let inArgsBlock = false;
          
          for (let j = i - 1; j >= 0; j--) {
            const line = lines[j].trim();
            if (line.includes('export default') || line.includes('const meta')) {
              inMainBlock = true;
              break;
            }
            if (line.includes('.args') || line.includes('args:') || line.includes('argTypes')) {
              inArgsBlock = true;
              break;
            }
          }
          
          if (inMainBlock && !inArgsBlock) {
            updatedContent = content.replace(simpleTitleRegex, `$1${newTitle}$3`);
            titleFound = true;
            break;
          }
        }
      }
    }
    
    if (!titleFound) {
      console.log(`⚠️  Could not find title property in main story config: ${filePath}`);
      return false;
    }
    
    // Only write if content changed
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      console.log(`   New title: ${newTitle}`);
      return true;
    } else {
      console.log(`✨ Already correct: ${filePath}`);
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findStorybookFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other common directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        findStorybookFiles(filePath, filesList);
      }
    } else if (file.match(/\.stories\.(js|tsx)$/)) {
      filesList.push(filePath);
    }
  }
  
  return filesList;
}

function main() {
  console.log('🔍 Finding Storybook files...\n');
  
  // If specific files are provided as arguments, process only those
  const args = process.argv.slice(2);
  let storybookFiles;
  
  if (args.length > 0) {
    // Process specific files provided as arguments
    storybookFiles = args.filter(file => 
      file.match(/\.stories\.(js|tsx)$/) && fs.existsSync(file)
    );
    console.log(`Processing ${storybookFiles.length} specified files\n`);
  } else {
    // Find all .stories.js and .stories.tsx files starting from ui/ directory
    const uiDir = path.join(process.cwd(), 'ui');
    
    if (!fs.existsSync(uiDir)) {
      console.error('❌ ui/ directory not found in current working directory');
      process.exit(1);
    }
    
    storybookFiles = findStorybookFiles(uiDir);
    console.log(`Found ${storybookFiles.length} Storybook files\n`);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const filePath of storybookFiles) {
    if (updateStoryTitle(filePath)) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully processed: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total files: ${storybookFiles.length}`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { 
  generateTitleFromPath, 
  updateStoryTitle, 
  extractComponentName, 
  toPascalCase, 
  isDeprecated 
};