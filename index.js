import { detailedDiff } from 'deep-object-diff';
import {
  existsSync, readFileSync, statSync, writeFileSync,
} from 'node:fs';
import fetch from 'node-fetch';
import XLSX from 'xlsx';

const excelLink = 'https://www.twc.texas.gov/files/news/warn-act-listings-2023-twc.xlsx';


const dataCache = {};
const dataCacheFileName = './dataCache.json';
if (existsSync(dataCacheFileName)) {
  console.log(`\nData cache file ${dataCacheFileName} exists.  Loading...`);
  const data = JSON.parse(readFileSync(dataCacheFileName, 'utf-8'));
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && (typeof data[key] !== 'object' || Object.keys(data[key]).length > 0)) {
        dataCache[key] = data[key];
      }
    });
}

fetch(excelLink)
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, {type: 'buffer'});
    const sheetNameList = workbook.SheetNames;
    const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);

    const added = detailedDiff(dataCache, xlData).added;

    if (added['0'] === undefined) {
      console.log('\nNo new layoffs have been added since the last time you ran this.\n');
      return;
    }

    console.log('\nSince the last time you ran this, here are the added layoffs:', added, '\n');

    try {
      writeFileSync(dataCacheFileName, JSON.stringify(xlData));
    } catch (err) {
      console.error(err);
    }
  }
)
.catch(console.error);

