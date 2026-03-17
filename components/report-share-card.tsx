import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { formatDayUnits, WorkerReport } from "../src/utils/labour";

type ReportShareCardProps = {
  report: WorkerReport;
};

export function ReportShareCard({ report }: ReportShareCardProps) {
  return (
    <View style={styles.page}>
      <LinearGradient
        colors={["#0f172a", "#1e3a8a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.eyebrow}>Bhimijyani Painting Contractors</Text>
        <Text style={styles.title}>Monthly Labour Report</Text>
        <Text style={styles.subtitle}>{report.monthLabel}</Text>

        <View style={styles.heroMeta}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Worker</Text>
            <Text style={styles.metaValue}>{report.labourName}</Text>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>{report.generatedAtLabel}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Days</Text>
          <Text style={styles.summaryValue}>{formatDayUnits(report.totalDays)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Advance</Text>
          <Text style={styles.summaryValue}>Rs {report.totalAdvance}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.dateColumn]}>Date</Text>
          <Text style={[styles.headerText, styles.dayColumn]}>Day</Text>
          <Text style={[styles.headerText, styles.statusColumn]}>Status</Text>
          <Text style={[styles.headerText, styles.moneyColumn]}>Advance</Text>
        </View>

        {report.rows.map((row, index) => (
          <View
            key={row.id}
            style={[
              styles.tableRow,
              index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
            ]}
          >
            <Text style={[styles.bodyText, styles.dateColumn]}>{row.dateLabel}</Text>
            <Text style={[styles.bodyText, styles.dayColumn]}>{row.dayLabel}</Text>

            <View style={styles.statusColumn}>
              <View style={[styles.statusBadge, toneStyles[row.statusTone]]}>
                <Text style={styles.statusText}>{row.statusLabel}</Text>
              </View>
            </View>

            <Text style={[styles.bodyText, styles.moneyColumn]}>Rs {row.advance}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All rights reserved to Bhimijyani Painting Contractors.
        </Text>
      </View>
    </View>
  );
}

const toneStyles = StyleSheet.create({
  success: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  danger: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  accent: {
    backgroundColor: "#fef3c7",
    borderColor: "#fcd34d",
  },
  muted: {
    backgroundColor: "#e2e8f0",
    borderColor: "#cbd5e1",
  },
});

const styles = StyleSheet.create({
  page: {
    width: 1120,
    backgroundColor: "#f8fafc",
    padding: 32,
  },
  hero: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 30,
  },
  eyebrow: {
    color: "#fbbf24",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 44,
    fontWeight: "800",
    marginTop: 14,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 24,
    marginTop: 10,
  },
  heroMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 28,
  },
  metaCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  metaLabel: {
    color: "#bfdbfe",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryLabel: {
    color: "#475569",
    fontSize: 18,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 10,
  },
  table: {
    marginTop: 24,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dbe3ef",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerText: {
    color: "#1e3a8a",
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 68,
  },
  tableRowEven: {
    backgroundColor: "#ffffff",
  },
  tableRowOdd: {
    backgroundColor: "#f8fafc",
  },
  bodyText: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "600",
  },
  dateColumn: {
    width: 180,
  },
  dayColumn: {
    width: 120,
  },
  statusColumn: {
    flex: 1,
    paddingRight: 16,
  },
  moneyColumn: {
    width: 170,
    textAlign: "right",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  footerText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
  },
});
