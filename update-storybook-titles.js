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
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function generateTitleFromPath(filePath) {
  // Find the ui/ directory and get the path after it
  const uiIndex = filePath.indexOf('/ui/');
  if (uiIndex === -1) {
    throw new Error(`Path does not contain /ui/: ${filePath}`);
  }
  
  const relativePath = filePath.substring(uiIndex + 4); // +4 to skip "/ui/"
  const pathParts = path.dirname(relativePath).split('/');
  
  // Convert each part to PascalCase
  const titleParts = pathParts.map(part => toPascalCase(part));
  
  // Get component name from filename (remove .stories.js/.stories.tsx)
  const filename = path.basename(filePath);
  const componentName = filename.replace(/\.stories\.(js|tsx)$/, '');
  const componentTitlePart = toPascalCase(componentName);
  
  // The component name should replace the last directory part if they match
  // e.g., modal-body/modal-body.stories.tsx -> ModalBody (not ModalBody/ModalBody)
  const lastDirPart = titleParts[titleParts.length - 1];
  if (lastDirPart === componentTitlePart) {
    return titleParts.join('/');
  } else {
    return [...titleParts, componentTitlePart].join('/');
  }
}

function updateStoryTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newTitle = generateTitleFromPath(filePath);
    
    // Look for title property in various formats
    const titleRegexPatterns = [
      /(\s+title:\s*['"`])([^'"`]+)(['"`])/g,
      /(title:\s*['"`])([^'"`]+)(['"`])/g,
    ];
    
    let updatedContent = content;
    let titleFound = false;
    
    for (const regex of titleRegexPatterns) {
      if (regex.test(content)) {
        updatedContent = content.replace(regex, `$1${newTitle}$3`);
        titleFound = true;
        break;
      }
    }
    
    if (!titleFound) {
      console.log(`⚠️  Could not find title property in: ${filePath}`);
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

module.exports = { generateTitleFromPath, updateStoryTitle };