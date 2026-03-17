import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  AppUpdateInfo,
  canCheckForAppUpdate,
  checkForAppUpdate,
  openAppUpdate,
} from "../src/utils/app-update";

export default function RootLayout() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const runUpdateCheck = useCallback(async () => {
    if (isCheckingUpdate) {
      return;
    }

    setIsCheckingUpdate(true);

    try {
      const nextUpdate = await checkForAppUpdate();

      if (!nextUpdate) {
        setUpdateInfo(null);
        return;
      }

      if (dismissedVersion === nextUpdate.latestVersion) {
        return;
      }

      setUpdateInfo(nextUpdate);
    } catch (error) {
      console.warn("App update check failed", error);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [dismissedVersion, isCheckingUpdate]);

  useEffect(() => {
    if (!canCheckForAppUpdate()) {
      return;
    }

    void runUpdateCheck();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void runUpdateCheck();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [runUpdateCheck]);

  const closeUpdateModal = () => {
    if (!updateInfo) {
      return;
    }

    setDismissedVersion(updateInfo.latestVersion);
    setUpdateInfo(null);
  };

  const handleUpdatePress = async () => {
    if (!updateInfo) {
      return;
    }

    await openAppUpdate(updateInfo);
  };

  return (
    <SafeAreaProvider>
      <Slot />

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(updateInfo)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Update Available</Text>

            <Text style={styles.subtitle}>
              Version {updateInfo?.latestVersion} is ready. You are on {updateInfo?.currentVersion}.
            </Text>

            <ScrollView style={styles.notesBox}>
              <Text style={styles.notesText}>{updateInfo?.notes}</Text>
            </ScrollView>

            <Text style={styles.helperText}>
              Tap update to download the latest APK. Install it over the current app and your saved data will stay on the device.
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={closeUpdateModal}
                style={[styles.button, styles.secondaryButton]}
              >
                <Text style={styles.secondaryButtonText}>Later</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleUpdatePress();
                }}
                style={[styles.button, styles.primaryButton]}
              >
                <Text style={styles.primaryButtonText}>Update</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update check is now fully background; no UI shown while checking */}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#334155",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  notesBox: {
    maxHeight: 180,
    marginTop: 16,
    backgroundColor: "#111c34",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesText: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 22,
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#f59e0b",
  },
  primaryButtonText: {
    color: "#111827",
    fontWeight: "800",
  },
  checkingPill: {
    position: "absolute",
    right: 16,
    top: 52,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#fbbf24",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  checkingText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
});
