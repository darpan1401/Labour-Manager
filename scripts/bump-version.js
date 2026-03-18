// scripts/bump-version.js
// Auto-increment expo.version and expo.android.versionCode in app.json

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

function bumpVersion(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3) throw new Error('Version must be x.y.z');
  parts[2] += 1;
  return parts.join('.');
}

const oldVersion = appJson.expo.version;
const newVersion = bumpVersion(oldVersion);
appJson.expo.version = newVersion;

if (!appJson.expo.android) appJson.expo.android = {};
const oldCode = Number(appJson.expo.android.versionCode) || 1;
appJson.expo.android.versionCode = oldCode + 1;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`Bumped version: ${oldVersion} → ${newVersion}`);
console.log(`Bumped android.versionCode: ${oldCode} → ${oldCode + 1}`);
