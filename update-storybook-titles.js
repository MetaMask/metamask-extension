#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function toPascalCase(str) {
  // Special case for "ui" -> "UI"
  if (str.toLowerCase() === 'ui') {
    return 'UI';
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
  // Find the ui/ directory and get the path after it
  const uiIndex = filePath.indexOf('/ui/');
  if (uiIndex === -1) {
    throw new Error(`Path does not contain /ui/: ${filePath}`);
  }
  
  const relativePath = filePath.substring(uiIndex + 4); // +4 to skip "/ui/"
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
    
    // Only match title property in the export default block
    // This regex matches the title property that comes after 'export default {' 
    // and before the component property or other properties
    const exportDefaultRegex = /(export\s+default\s*\{[^}]*?title:\s*['"`])([^'"`]+)(['"`][^}]*?\})/s;
    
    let updatedContent = content;
    let titleFound = false;
    
    if (exportDefaultRegex.test(content)) {
      updatedContent = content.replace(exportDefaultRegex, `$1${newTitle}$3`);
      titleFound = true;
    }
    
    // Fallback: try to find a standalone title property (but be more careful)
    if (!titleFound) {
      // Look for title at the beginning of a line (possibly with whitespace)
      // and ensure it's not inside args or other nested objects
      const standaloneRegex = /^(\s*title:\s*['"`])([^'"`]+)(['"`])/m;
      
      // Check if this appears to be in the main export default block by looking at context
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (standaloneRegex.test(lines[i])) {
          // Check if we're in the export default block
          let inExportDefault = false;
          for (let j = i - 1; j >= 0; j--) {
            if (lines[j].includes('export default')) {
              inExportDefault = true;
              break;
            }
            if (lines[j].includes('args') || lines[j].includes('argTypes')) {
              break; // We're in a nested object, skip this match
            }
          }
          
          if (inExportDefault) {
            updatedContent = content.replace(standaloneRegex, `$1${newTitle}$3`);
            titleFound = true;
            break;
          }
        }
      }
    }
    
    if (!titleFound) {
      console.log(`⚠️  Could not find title property in export default: ${filePath}`);
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