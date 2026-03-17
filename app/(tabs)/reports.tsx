import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  InteractionManager,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";

import {
  buildWorkerReport,
  formatDayUnits,
  LabourWithRecords,
  readLaboursWithRecords,
  WorkerReport,
} from "../../src/utils/labour";
import {
  buildWorkerReportHtml,
  getWorkerReportFingerprint,
} from "../../src/utils/report-html";

const REPORT_WARM_COUNT = 2;
const reportPdfCache = new Map<string, { signature: string; uri?: string; promise?: Promise<string> }>();

export default function ReportsScreen() {
  const [labours, setLabours] = useState<LabourWithRecords[]>([]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const storedLabours = await readLaboursWithRecords();
    setLabours(storedLabours);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    let cancelled = false;

    const interaction = InteractionManager.runAfterInteractions(() => {
      warmVisibleReports(labours.slice(0, REPORT_WARM_COUNT), date, () => cancelled);
    });

    return () => {
      cancelled = true;
      interaction.cancel();
    };
  }, [date, labours]);

  const shareWorkerReport = async (labour: LabourWithRecords) => {
    if (sharingId) {
      return;
    }

    setSharingId(labour.id);

    try {
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert("Sharing unavailable", "This device cannot share PDF files right now.");
        return;
      }

      const report = buildWorkerReport(labour, date);
      const uri = await getOrCreateReportPdf(labour.id, report);

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `${labour.name} report`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Share failed", "Could not create the report PDF. Please try again.");
    } finally {
      setSharingId(null);
    }
  };

  const renderWorker = ({ item }: ListRenderItemInfo<LabourWithRecords>) => {
    const report = buildWorkerReport(item, date);
    const isCurrentShare = sharingId === item.id;

    return (
      <View style={styles.row}>
        <View style={styles.workerBlock}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.subtleText}>{report.monthLabel}</Text>
        </View>

        <Text style={styles.cell}>{formatDayUnits(report.totalDays)}</Text>
        <Text style={styles.cell}>Rs {report.totalAdvance}</Text>

        <TouchableOpacity
          disabled={Boolean(sharingId)}
          onPress={() => shareWorkerReport(item)}
          style={[styles.shareBtn, isCurrentShare && styles.shareBtnDisabled]}
        >
          <Text style={styles.shareText}>{isCurrentShare ? "Sharing..." : "Share"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Reports</Text>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={styles.monthBtn}
      >
        <Text style={styles.monthText}>
          {date.toLocaleDateString("en", { month: "long", year: "numeric" })}
        </Text>
        <Text style={styles.monthHint}>Tap to change month</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.headerText, styles.workerHeader]}>Worker</Text>
        <Text style={styles.headerText}>Days</Text>
        <Text style={styles.headerText}>Advance</Text>
        <Text style={styles.headerText}>Share</Text>
      </View>

      <FlatList
        data={labours}
        keyExtractor={(item) => item.id}
        renderItem={renderWorker}
        contentContainerStyle={labours.length === 0 ? styles.emptyList : styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={8}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No workers yet</Text>
            <Text style={styles.emptyText}>
              Add labours first, then monthly reports will be ready here.
            </Text>
          </View>
        }
      />

      {showPicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={(_, nextDate) => {
            setShowPicker(false);

            if (nextDate) {
              setDate(nextDate);
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  monthBtn: {
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#172554",
    borderWidth: 1,
    borderColor: "#3b82f6",
    alignItems: "center",
  },
  monthText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  monthHint: {
    color: "#93c5fd",
    fontSize: 12,
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#334155",
    paddingBottom: 8,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  workerHeader: {
    flex: 2,
    textAlign: "left",
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    backgroundColor: "#111c34",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1e3a8a",
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  workerBlock: {
    flex: 2,
    paddingRight: 12,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  subtleText: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  cell: {
    flex: 1,
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  shareBtn: {
    flex: 1,
    backgroundColor: "#f59e0b",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  shareBtnDisabled: {
    opacity: 0.7,
  },
  shareText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
  },
});

async function warmVisibleReports(
  labours: LabourWithRecords[],
  date: Date,
  isCancelled: () => boolean,
) {
  for (const labour of labours) {
    if (isCancelled()) {
      return;
    }

    try {
      const report = buildWorkerReport(labour, date);
      await getOrCreateReportPdf(labour.id, report);
    } catch (error) {
      console.warn("Warm report PDF failed", error);
    }
  }
}

async function getOrCreateReportPdf(labourId: string, report: WorkerReport) {
  const cacheKey = `${labourId}:${report.monthLabel}`;
  const signature = getWorkerReportFingerprint(report);
  const cached = reportPdfCache.get(cacheKey);

  if (cached?.signature === signature) {
    if (cached.uri) {
      return cached.uri;
    }

    if (cached.promise) {
      return cached.promise;
    }
  }

  const promise = Print.printToFileAsync({
    html: buildWorkerReportHtml(report),
  })
    .then(({ uri }) => {
      reportPdfCache.set(cacheKey, { signature, uri });
      return uri;
    })
    .catch((error) => {
      const current = reportPdfCache.get(cacheKey);

      if (current?.promise === promise) {
        reportPdfCache.delete(cacheKey);
      }

      throw error;
    });

  reportPdfCache.set(cacheKey, { signature, promise });
  return promise;
}
