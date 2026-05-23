import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Bar, CartesianChart } from "victory-native";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const CHART_HEIGHT = 180;
const MONTH_NAMES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const formatBucket = (iso, granularity) => {
  const [y, m, d] = iso.split("-");
  if (granularity === "month") return `${MONTH_NAMES[Number(m) - 1]}/${y.slice(2)}`;
  return `${d}/${m}`;
};

const ActivityBarChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  const buckets = data?.buckets ?? [];
  const granularity = data?.granularity ?? "day";
  const totalSessions = buckets.reduce((acc, b) => acc + (b.session_count ?? 0), 0);

  if (buckets.length === 0 || totalSessions === 0) {
    return (
      <Card style={styles.empty}>
        <Text style={styles.emptyText}>
          Sem treinos no período. Que tal começar agora?
        </Text>
      </Card>
    );
  }

  const points = buckets.map((b, i) => ({
    index: i,
    sessions: b.session_count,
    bucket: b.bucket_start,
  }));
  const counts = points.map((p) => p.sessions);
  const maxCount = Math.max(...counts, 1);
  const firstLabel = formatBucket(points[0].bucket, granularity);
  const lastLabel = formatBucket(points[points.length - 1].bucket, granularity);
  const granularityLabel =
    granularity === "day" ? "/dia" : granularity === "week" ? "/semana" : "/mês";

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Frequência</Text>
        <Text style={styles.label}>{`pico: ${maxCount}${granularityLabel}`}</Text>
      </View>
      <View style={{ height: CHART_HEIGHT }}>
        <CartesianChart
          data={points}
          xKey="index"
          yKeys={["sessions"]}
          domain={{ y: [0, Math.max(maxCount + 1, 3)] }}
          domainPadding={{ left: 16, right: 16, top: 16, bottom: 8 }}
        >
          {({ points: chartPoints, chartBounds }) => (
            <Bar
              points={chartPoints.sessions}
              chartBounds={chartBounds}
              color={colors.primary}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
              animate={{ type: "timing", duration: 250 }}
            />
          )}
        </CartesianChart>
      </View>
      <View style={styles.footer}>
        <Text style={styles.label}>{firstLabel}</Text>
        <Text style={styles.label}>{lastLabel}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  empty: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSubtle,
    textAlign: "center",
    fontSize: 13,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: "600",
  },
});

export default ActivityBarChart;
