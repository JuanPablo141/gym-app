import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CartesianChart, Line, Scatter } from "victory-native";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const CHART_HEIGHT = 180;

const formatDate = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const LoadProgressChart = ({ trend, isLoading }) => {
  if (isLoading) {
    return (
      <Card style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  const points = (trend ?? [])
    .filter((p) => p.top_weight_kg !== null)
    .slice()
    .reverse()
    .map((p, i) => ({
      index: i,
      weight: Number(p.top_weight_kg),
      date: p.date,
    }));

  if (points.length < 2) {
    return (
      <Card style={styles.empty}>
        <Text style={styles.emptyText}>
          Faça pelo menos 2 treinos com peso registrado pra ver a evolução.
        </Text>
      </Card>
    );
  }

  const weights = points.map((p) => p.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const firstDate = formatDate(points[0].date);
  const lastDate = formatDate(points[points.length - 1].date);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.label}>{`${minWeight} kg`}</Text>
        <Text style={styles.label}>{`${maxWeight} kg`}</Text>
      </View>
      <View style={{ height: CHART_HEIGHT }}>
        <CartesianChart
          data={points}
          xKey="index"
          yKeys={["weight"]}
          domainPadding={{ left: 12, right: 12, top: 16, bottom: 16 }}
        >
          {({ points: chartPoints }) => (
            <>
              <Line
                points={chartPoints.weight}
                color={colors.primary}
                strokeWidth={3}
                animate={{ type: "timing", duration: 300 }}
              />
              <Scatter
                points={chartPoints.weight}
                shape="circle"
                radius={5}
                style="fill"
                color={colors.primary}
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

export default LoadProgressChart;
