import Constants from "expo-constants";
import { Linking, Platform } from "react-native";

export type AppUpdateInfo = {
  currentVersion: string;
  latestVersion: string;
  notes: string;
  releaseUrl: string;
  downloadUrl: string;
  publishedAt?: string;
};

type UpdateConfig = {
  enabled?: boolean;
  githubOwner?: string;
  githubRepo?: string;
  apkAssetName?: string;
};

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  tag_name: string;
  body: string | null;
  html_url: string;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
};

export function canCheckForAppUpdate() {
  const config = getUpdateConfig();
  const isStandalone = Constants.appOwnership !== "expo";

  return (
    Platform.OS === "android" &&
    isStandalone &&
    Boolean(config.enabled && config.githubOwner && config.githubRepo)
  );
}

export async function checkForAppUpdate(): Promise<AppUpdateInfo | null> {
  if (!canCheckForAppUpdate()) {
    return null;
  }

  const config = getUpdateConfig();
  const currentVersion = getCurrentVersion();
  const response = await fetch(
    `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Update check failed with status ${response.status}`);
  }

  const release = (await response.json()) as GitHubRelease;
  const latestVersion = normalizeVersion(release.tag_name);

  if (compareVersions(latestVersion, currentVersion) <= 0) {
    return null;
  }

  const downloadUrl = getDownloadUrl(release, config);

  return {
    currentVersion,
    latestVersion,
    notes: formatNotes(release.body),
    releaseUrl: release.html_url,
    downloadUrl,
    publishedAt: release.published_at,
  };
}

export async function openAppUpdate(update: AppUpdateInfo) {
  const url = update.downloadUrl || update.releaseUrl;
  await Linking.openURL(url);
}

function getUpdateConfig(): UpdateConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    appUpdate?: UpdateConfig;
  };

  return extra.appUpdate ?? {};
}

function getCurrentVersion() {
  return (
    normalizeVersion(Constants.nativeAppVersion ?? "") ||
    normalizeVersion(Constants.expoConfig?.version ?? "") ||
    "0.0.0"
  );
}

function getDownloadUrl(release: GitHubRelease, config: UpdateConfig) {
  const assets = release.assets ?? [];

  const preferredAsset =
    assets.find((asset) => asset.name === config.apkAssetName) ??
    assets.find((asset) => asset.name.toLowerCase().endsWith(".apk"));

  return preferredAsset?.browser_download_url ?? release.html_url;
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, "");
}

function compareVersions(a: string, b: string) {
  const aParts = a.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const bParts = b.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = aParts[index] ?? 0;
    const right = bParts[index] ?? 0;

    if (left > right) {
      return 1;
    }

    if (left < right) {
      return -1;
    }
  }

  return 0;
}

function formatNotes(body: string | null) {
  const trimmed = body?.trim();

  if (!trimmed) {
    return "A newer build is available to install.";
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return lines.join("\n");
}
