import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const buildGradlePath = path.resolve(
  process.cwd(),
  "android",
  "app",
  "build.gradle",
);

const releaseSigningConfig = [
  "        release {",
  "            if (project.hasProperty('LABOUR_MANAGER_UPLOAD_STORE_FILE')) {",
  "                storeFile file(LABOUR_MANAGER_UPLOAD_STORE_FILE)",
  "                storePassword LABOUR_MANAGER_UPLOAD_STORE_PASSWORD",
  "                keyAlias LABOUR_MANAGER_UPLOAD_KEY_ALIAS",
  "                keyPassword LABOUR_MANAGER_UPLOAD_KEY_PASSWORD",
  "            }",
  "        }",
].join("\n");

let buildGradle = readFileSync(buildGradlePath, "utf8");

if (!buildGradle.includes("LABOUR_MANAGER_UPLOAD_STORE_FILE")) {
  const signingConfigBlockPattern =
    /signingConfigs\s*\{\n([\s\S]*?)\n    \}\n    buildTypes/m;

  buildGradle = buildGradle.replace(
    signingConfigBlockPattern,
    (fullMatch, innerContent) => {
      const trimmedInnerContent = innerContent.replace(/\n+$/, "");

      return [
        "signingConfigs {",
        trimmedInnerContent,
        releaseSigningConfig,
        "    }",
        "    buildTypes",
      ].join("\n");
    },
  );
}

const buildTypesMarker = "    buildTypes {\n";
const buildTypesStartIndex = buildGradle.indexOf(buildTypesMarker);

if (buildTypesStartIndex === -1) {
  throw new Error("Failed to locate Android buildTypes block.");
}

const buildTypesSection = buildGradle.slice(buildTypesStartIndex);
const updatedBuildTypesSection = buildTypesSection.replace(
  /release\s*\{\n([\s\S]*?)signingConfig signingConfigs\.debug/m,
  (fullMatch, innerContent) =>
    ["release {", innerContent, "            signingConfig signingConfigs.release"].join(
      "\n",
    ),
);

buildGradle =
  buildGradle.slice(0, buildTypesStartIndex) + updatedBuildTypesSection;

if (!buildGradle.includes("signingConfig signingConfigs.release")) {
  throw new Error("Failed to switch Android release signing config.");
}

writeFileSync(buildGradlePath, buildGradle);
