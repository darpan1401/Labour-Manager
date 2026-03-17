import AsyncStorage from "@react-native-async-storage/async-storage";

export const LEGACY_LABOURS_STORAGE_KEY = "labours";
export const LABOURS_INDEX_STORAGE_KEY = "labours:index";
export const LABOUR_RECORDS_KEY_PREFIX = "labour:records:";

export type PayType = "" | "0.5" | "1" | "1.5";
export type DayStatus = "" | "P" | "A" | "OT";

export type DayRecord = {
  date: string;
  status: DayStatus | string;
  advance: number;
  payType: PayType | string;
};

export type Labour = {
  id: string;
  name: string;
  phone: string;
};

export type LabourRecords = Record<string, DayRecord[]>;

export type LabourWithRecords = Labour & {
  records?: LabourRecords;
};

export type WorkerReportRow = {
  id: string;
  dateLabel: string;
  dayLabel: string;
  statusLabel: string;
  statusTone: "success" | "danger" | "accent" | "muted";
  advance: number;
  units: number;
};

export type WorkerReport = {
  labourName: string;
  monthLabel: string;
  totalDays: number;
  totalAdvance: number;
  rows: WorkerReportRow[];
  generatedAtLabel: string;
};

let storageReadyPromise: Promise<void> | null = null;

export async function readLabours(): Promise<Labour[]> {
  await ensureStorageReady();

  const data = await AsyncStorage.getItem(LABOURS_INDEX_STORAGE_KEY);
  return data ? (JSON.parse(data) as Labour[]) : [];
}

export async function saveLabours(labours: Labour[]) {
  await ensureStorageReady();
  await AsyncStorage.setItem(LABOURS_INDEX_STORAGE_KEY, JSON.stringify(labours));
}

export async function readLabourById(labourId: string) {
  const labours = await readLabours();
  return labours.find((labour) => labour.id === labourId) ?? null;
}

export async function readLabourRecords(labourId: string): Promise<LabourRecords> {
  await ensureStorageReady();

  const data = await AsyncStorage.getItem(getLabourRecordsStorageKey(labourId));
  return data ? sanitizeRecordsMap(JSON.parse(data) as LabourRecords) : {};
}

export async function readLabourWithRecords(labourId: string): Promise<LabourWithRecords | null> {
  const [labour, records] = await Promise.all([
    readLabourById(labourId),
    readLabourRecords(labourId),
  ]);

  if (!labour) {
    return null;
  }

  return {
    ...labour,
    records,
  };
}

export async function readLaboursWithRecords(): Promise<LabourWithRecords[]> {
  const labours = await readLabours();

  if (labours.length === 0) {
    return [];
  }

  const entries = await AsyncStorage.multiGet(
    labours.map((labour) => getLabourRecordsStorageKey(labour.id)),
  );

  const recordsById = new Map<string, LabourRecords>();

  entries.forEach(([key, value]) => {
    if (!value) {
      return;
    }

    const labourId = key.replace(LABOUR_RECORDS_KEY_PREFIX, "");
    recordsById.set(labourId, sanitizeRecordsMap(JSON.parse(value) as LabourRecords));
  });

  return labours.map((labour) => ({
    ...labour,
    records: recordsById.get(labour.id) ?? {},
  }));
}

export async function saveLabourMonthRecords(
  labourId: string,
  monthKey: string,
  records: DayRecord[],
) {
  await ensureStorageReady();

  const normalizedRecords = records.map(normalizeRecord);
  const currentRecords = await readLabourRecords(labourId);
  const nextRecords: LabourRecords = {
    ...currentRecords,
  };

  if (hasMeaningfulMonthData(normalizedRecords)) {
    nextRecords[monthKey] = normalizedRecords;
  } else {
    delete nextRecords[monthKey];
  }

  const storageKey = getLabourRecordsStorageKey(labourId);

  if (Object.keys(nextRecords).length === 0) {
    await AsyncStorage.removeItem(storageKey);
  } else {
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextRecords));
  }

  return nextRecords;
}

export async function deleteLabourById(labourId: string) {
  await ensureStorageReady();

  const currentLabours = await readLabours();
  const nextLabours = currentLabours.filter((labour) => labour.id !== labourId);

  await Promise.all([
    saveLabours(nextLabours),
    AsyncStorage.removeItem(getLabourRecordsStorageKey(labourId)),
  ]);

  return nextLabours;
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function createMonthRecords(date: Date): DayRecord[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const dayDate = new Date(year, month, dayNumber, 12);

    return {
      date: dayDate.toISOString(),
      status: "",
      advance: 0,
      payType: "",
    };
  });
}

export function normalizeRecord(record: DayRecord): DayRecord {
  const status = record.status ?? "";
  const rawPayType = record.payType ?? "";
  const payType = status === "A" || status === "" || rawPayType === "1" ? "" : rawPayType;

  return {
    date: record.date,
    status,
    payType,
    advance: Number(record.advance || 0),
  };
}

export function getDayUnits(record: DayRecord) {
  if (record.status === "" || record.status === "A") {
    return 0;
  }

  const customUnits = Number(record.payType);
  if (!Number.isNaN(customUnits) && customUnits > 0) {
    return customUnits;
  }

  if (record.status === "OT") {
    return 1.5;
  }

  return 1;
}

export function formatDayUnits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function buildWorkerReport(labour: LabourWithRecords, date: Date): WorkerReport {
  const monthKey = getMonthKey(date);
  const records = (labour.records?.[monthKey] ?? createMonthRecords(date)).map(normalizeRecord);

  const rows = records.map((record, index) => {
    const units = getDayUnits(record);
    const rowDate = new Date(record.date);

    return {
      id: `${labour.id}-${rowDate.toISOString()}-${index}`,
      dateLabel: rowDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      dayLabel: rowDate.toLocaleDateString("en", {
        weekday: "short",
      }),
      statusLabel: getStatusLabel(record),
      statusTone: getStatusTone(record),
      advance: Number(record.advance || 0),
      units,
    };
  });

  return {
    labourName: labour.name,
    monthLabel: date.toLocaleDateString("en", {
      month: "long",
      year: "numeric",
    }),
    totalDays: rows.reduce((total, row) => total + row.units, 0),
    totalAdvance: rows.reduce((total, row) => total + row.advance, 0),
    rows,
    generatedAtLabel: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

function getStatusLabel(record: DayRecord) {
  if (record.status === "A") {
    return "Absent";
  }

  if (record.status === "") {
    return "Not Marked";
  }

  if (record.payType === "0.5") {
    return "Half Day";
  }

  if (record.payType === "1.5") {
    return "One and Half Day";
  }

  if (record.status === "OT") {
    return "Overtime";
  }

  return "Present";
}

function getStatusTone(record: DayRecord): WorkerReportRow["statusTone"] {
  if (record.status === "A") {
    return "danger";
  }

  if (record.status === "") {
    return "muted";
  }

  if (record.payType === "0.5") {
    return "accent";
  }

  if (record.status === "OT" || record.payType === "1.5") {
    return "accent";
  }

  return "success";
}

function getLabourRecordsStorageKey(labourId: string) {
  return `${LABOUR_RECORDS_KEY_PREFIX}${labourId}`;
}

function sanitizeRecordsMap(records: LabourRecords): LabourRecords {
  return Object.fromEntries(
    Object.entries(records).map(([monthKey, monthRecords]) => [
      monthKey,
      monthRecords.map(normalizeRecord),
    ]),
  );
}

function hasMeaningfulMonthData(records: DayRecord[]) {
  return records.some((record) => {
    const normalized = normalizeRecord(record);

    return (
      normalized.status !== "" ||
      normalized.payType !== "" ||
      Number(normalized.advance || 0) > 0
    );
  });
}

async function ensureStorageReady() {
  if (!storageReadyPromise) {
    storageReadyPromise = migrateLegacyStorage().finally(() => {
      storageReadyPromise = null;
    });
  }

  await storageReadyPromise;
}

async function migrateLegacyStorage() {
  const entries = await AsyncStorage.multiGet([
    LABOURS_INDEX_STORAGE_KEY,
    LEGACY_LABOURS_STORAGE_KEY,
  ]);

  const indexValue = entries[0][1];
  const legacyValue = entries[1][1];

  if (indexValue || !legacyValue) {
    return;
  }

  const legacyLabours = JSON.parse(legacyValue) as LabourWithRecords[];

  const nextIndex = legacyLabours.map(({ id, name, phone }) => ({
    id,
    name,
    phone,
  }));

  const setOperations: [string, string][] = [
    [LABOURS_INDEX_STORAGE_KEY, JSON.stringify(nextIndex)],
  ];

  legacyLabours.forEach((labour) => {
    const cleanedRecords = sanitizeRecordsMap(labour.records ?? {});

    if (Object.keys(cleanedRecords).length === 0) {
      return;
    }

    setOperations.push([
      getLabourRecordsStorageKey(labour.id),
      JSON.stringify(cleanedRecords),
    ]);
  });

  await AsyncStorage.multiSet(setOperations);
  await AsyncStorage.removeItem(LEGACY_LABOURS_STORAGE_KEY);
}
