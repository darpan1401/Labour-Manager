import { readFileSync } from "node:fs";
import path from "node:path";

const appConfigPath = path.resolve(process.cwd(), "app.json");
const rawConfig = readFileSync(appConfigPath, "utf8");
const parsedConfig = JSON.parse(rawConfig);

const expoConfig = parsedConfig.expo ?? {};
const appUpdateConfig = expoConfig.extra?.appUpdate ?? {};

const version = String(expoConfig.version ?? "0.0.0").trim();
const apkAssetName = String(appUpdateConfig.apkAssetName ?? "labour-manager.apk").trim();
const releaseTag = `v${version.replace(/^v/i, "")}`;
const releaseName = `Labour Manager v${version.replace(/^v/i, "")}`;

process.stdout.write(
  [
    `version=${version}`,
    `apk_asset_name=${apkAssetName}`,
    `release_tag=${releaseTag}`,
    `release_name=${releaseName}`,
  ].join("\n"),
);
