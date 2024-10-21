import { filterE2eChangedFiles } from '../../test/e2e/changedFilesUtil';

const changedOrNewTests = filterE2eChangedFiles();

//15 minutes, plus 3 minutes for every changed file, up to a maximum of 30 minutes
const extraTime = Math.min(15 + changedOrNewTests.length * 3, 30);

console.log(extraTime);
