import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Area, CartesianChart, Line } from "victory-native";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const CHART_HEIGHT = 180;
const VOLUME_COLOR = "#10b981";

const formatDate = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatVolume = (v) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)}kg`;
};

const VolumeProgressChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  const points = (data?.points ?? []).map((p, i) => ({
    index: i,
    volume: Number(p.volume_kg),
    date: p.date,
  }));

  if (points.length < 2) {
    return (
      <Card style={styles.empty}>
        <Text style={styles.emptyText}>
          Faça pelo menos 2 treinos pra ver a evolução do volume.
        </Text>
      </Card>
    );
  }

  const volumes = points.map((p) => p.volume);
  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);
  const firstDate = formatDate(points[0].date);
  const lastDate = formatDate(points[points.length - 1].date);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.label}>{formatVolume(minVolume)}</Text>
        <Text style={styles.label}>{formatVolume(maxVolume)}</Text>
      </View>
      <View style={{ height: CHART_HEIGHT }}>
        <CartesianChart
          data={points}
          xKey="index"
          yKeys={["volume"]}
          domainPadding={{ left: 12, right: 12, top: 16, bottom: 16 }}
        >
          {({ points: chartPoints, chartBounds }) => (
            <>
              <Area
                points={chartPoints.volume}
                y0={chartBounds.bottom}
                color={VOLUME_COLOR}
                opacity={0.18}
                animate={{ type: "timing", duration: 300 }}
              />
              <Line
                points={chartPoints.volume}
                color={VOLUME_COLOR}
                strokeWidth={3}
                animate={{ type: "timing", duration: 300 }}
              />
            </>
          )}
        </CartesianChart>
      </View>
      <View style={styles.footer}>
        <Text style={styles.label}>{firstDate}</Text>
        <Text style={styles.label}>{lastDate}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
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

export default VolumeProgressChart;
