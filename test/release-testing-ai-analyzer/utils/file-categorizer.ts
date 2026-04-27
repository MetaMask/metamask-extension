/**
 * Categorizes changed files by type for better analysis
 */

import type { PullRequestFile, FileCategories } from '../types';

export class FileCategorizer {
  /**
   * Categorizes files into different groups for analysis
   *
   * @param files
   */
  categorizeFiles(files: PullRequestFile[]): FileCategories {
    const categories: FileCategories = {
      controllers: [],
      uiComponents: [],
      migrations: [],
      tests: [],
      config: [],
      other: [],
    };

    files.forEach((file) => {
      const filename = file.filename.toLowerCase();

      // Controllers
      if (
        filename.includes('controller') ||
        filename.includes('app/scripts/controllers/')
      ) {
        categories.controllers.push(file.filename);
      }
      // Migrations
      else if (
        filename.includes('migration') ||
        filename.includes('app/scripts/migrations/')
      ) {
        categories.migrations.push(file.filename);
      }
      // UI Components
      else if (
        filename.includes('ui/components/') ||
        filename.includes('ui/pages/') ||
        (filename.includes('.tsx') && filename.includes('ui/'))
      ) {
        categories.uiComponents.push(file.filename);
      }
      // Tests
      else if (
        filename.includes('.test.') ||
        filename.includes('.spec.') ||
        filename.includes('test/')
      ) {
        categories.tests.push(file.filename);
      }
      // Config files
      else if (
        filename.includes('package.json') ||
        filename.includes('yarn.lock') ||
        filename.includes('tsconfig') ||
        filename.includes('webpack') ||
        filename.includes('manifest') ||
        filename.includes('.github/') ||
        filename.includes('lavamoat/')
      ) {
        categories.config.push(file.filename);
      }
      // Other
      else {
        categories.other.push(file.filename);
      }
    });

    return categories;
  }
}
