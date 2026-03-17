import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createMonthRecords,
  DayRecord,
  getMonthKey,
  normalizeRecord,
  LabourWithRecords,
  readLabourWithRecords,
  saveLabourMonthRecords,
} from "../../src/utils/labour";

export default function LabourAttendance() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const labourId = Array.isArray(id) ? id[0] : id;

  const [labour, setLabour] = useState<LabourWithRecords | null>(null);
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPersist, setNeedsPersist] = useState(false);

  const monthKey = getMonthKey(date);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setNeedsPersist(false);

      if (!labourId) {
        if (!active) {
          return;
        }

        setLabour(null);
        setRecords([]);
        setIsLoading(false);
        return;
      }

      const foundLabour = await readLabourWithRecords(labourId);

      if (!active) {
        return;
      }

      setLabour(foundLabour);

      if (!foundLabour) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      const monthRecords = foundLabour.records?.[monthKey];

      if (monthRecords?.length) {
        setRecords(monthRecords.map(normalizeRecord));
      } else {
        setRecords(createMonthRecords(date));
      }

      setIsLoading(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, [date, labourId, monthKey]);

  useEffect(() => {
    if (isLoading || !needsPersist || !labourId) {
      return;
    }

    const timer = setTimeout(async () => {
      const updatedRecords = await saveLabourMonthRecords(labourId, monthKey, records);

      setLabour((currentLabour) => {
        if (!currentLabour) {
          return currentLabour;
        }

        return {
          ...currentLabour,
          records: updatedRecords,
        };
      });
      setNeedsPersist(false);
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoading, labourId, monthKey, needsPersist, records]);

  const updateRecord = (index: number, updater: (record: DayRecord) => DayRecord) => {
    setRecords((currentRecords) =>
      currentRecords.map((record, recordIndex) =>
        recordIndex === index ? normalizeRecord(updater(record)) : record,
      ),
    );
    setNeedsPersist(true);
  };

  const setStatus = (index: number, status: string) => {
    const currentRecord = records[index];

    if (!currentRecord) {
      return;
    }

    if (status === "OT" && currentRecord.status !== "P" && currentRecord.status !== "OT") {
      return;
    }

    updateRecord(index, (record) => ({
      ...record,
      status,
      payType: status === "A" || status === "" ? "" : record.payType,
    }));
  };

  const setPayType = (index: number, type: string) => {
    const currentRecord = records[index];

    if (!currentRecord || currentRecord.status === "" || currentRecord.status === "A") {
      setMenuIndex(null);
      return;
    }

    updateRecord(index, (record) => ({
      ...record,
      payType: type,
    }));

    setMenuIndex(null);
  };

  const setAdvance = (index: number, value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    const advance = Number.parseInt(onlyDigits, 10);

    updateRecord(index, (record) => ({
      ...record,
      advance: Number.isNaN(advance) ? 0 : advance,
    }));
  };

  const totalAdvance = records.reduce((total, record) => total + Number(record.advance || 0), 0);

  const renderItem = ({ item, index }: { item: DayRecord; index: number }) => {
    const rowDate = new Date(item.date);

    return (
      <View style={styles.row}>
        <View style={styles.colDay}>
          <Text style={styles.day}>{rowDate.getDate()}</Text>
          <Text style={styles.dayName}>
            {rowDate.toLocaleDateString("en", { weekday: "short" })}
          </Text>
        </View>

        <View style={styles.colStatus}>
          <TouchableOpacity
            onPress={() => setStatus(index, "P")}
            style={[styles.circle, item.status === "P" && styles.pActive]}
          >
            <Text style={styles.circleText}>P</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatus(index, "A")}
            style={[styles.circle, item.status === "A" && styles.aActive]}
          >
            <Text style={styles.circleText}>A</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatus(index, "OT")}
            style={[styles.circle, item.status === "OT" && styles.otActive]}
          >
            <Text style={styles.circleText}>OT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.colMenu}>
          <TouchableOpacity onPress={() => setMenuIndex(index)}>
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>

          <Text style={styles.payMark}>{formatPayType(item.payType)}</Text>
        </View>

        <TextInput
          keyboardType="number-pad"
          onChangeText={(value) => setAdvance(index, value)}
          placeholder="Rs"
          placeholderTextColor="#94a3b8"
          style={styles.advanceInput}
          value={item.advance ? String(item.advance) : ""}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>{labour?.name ?? "Worker"}</Text>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={styles.monthBtn}
      >
        <Text style={styles.monthText}>
          {date.toLocaleDateString("en", { month: "long", year: "numeric" })}
        </Text>
      </TouchableOpacity>

      <Text style={styles.advance}>Total Advance Rs {totalAdvance}</Text>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#f59e0b" size="large" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.date}
          renderItem={renderItem}
          extraData={menuIndex}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={8}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={records.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No attendance found</Text>
              <Text style={styles.emptyText}>
                Open this worker from the labours list after adding one to start tracking days.
              </Text>
            </View>
          }
        />
      )}

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

      <Modal
        transparent
        visible={menuIndex !== null}
        onRequestClose={() => setMenuIndex(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuIndex(null)}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <TouchableOpacity onPress={() => setPayType(menuIndex!, "0.5")}>
              <Text style={styles.modalItem}>Half Day</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPayType(menuIndex!, "1.5")}>
              <Text style={styles.modalItem}>One and Half Day</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function formatPayType(value: string) {
  if (value === "0.5") {
    return "1/2";
  }

  if (value === "1.5") {
    return "1.5";
  }

  return "";
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
  },
  title: {
    fontSize: 26,
    color: "white",
    fontWeight: "bold",
  },
  monthBtn: {
    alignSelf: "center",
    marginVertical: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  monthText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  advance: {
    color: "#f59e0b",
    marginBottom: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#cbd5e1",
    fontSize: 15,
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
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  colDay: {
    width: 60,
  },
  colStatus: {
    width: 150,
    flexDirection: "row",
    gap: 10,
  },
  colMenu: {
    width: 40,
    alignItems: "center",
  },
  day: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  dayName: {
    color: "#94a3b8",
    fontSize: 12,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#64748b",
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  pActive: {
    backgroundColor: "#22c55e",
  },
  aActive: {
    backgroundColor: "#ef4444",
  },
  otActive: {
    backgroundColor: "#38bdf8",
  },
  payMark: {
    color: "#f59e0b",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "700",
  },
  advanceInput: {
    width: 84,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 8,
    color: "white",
    textAlign: "center",
  },
  menuIcon: {
    color: "white",
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 14,
    width: 220,
  },
  modalItem: {
    color: "white",
    fontSize: 16,
    paddingVertical: 10,
    textAlign: "center",
  },
});
