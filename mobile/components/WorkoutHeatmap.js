import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const CELL_SIZE = 12;
const CELL_GAP = 3;
const SLOT = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 14;

const MONTH_NAMES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const DAY_ABBR = ["Seg", "", "Qua", "", "Sex", "", ""];

const INTENSITY_COLORS = [
  colors.divider,
  "#bfd7f7",
  "#5b9bf0",
  colors.primary,
];

const colorForCount = (count) => {
  if (count <= 0) return INTENSITY_COLORS[0];
  if (count === 1) return INTENSITY_COLORS[1];
  if (count === 2) return INTENSITY_COLORS[2];
  return INTENSITY_COLORS[3];
};

const dateFromIso = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const pythonWeekday = (date) => (date.getDay() + 6) % 7;

const buildGrid = (cells, startDateIso) => {
  const startWeekday = pythonWeekday(dateFromIso(startDateIso));
  const numWeeks = Math.ceil((startWeekday + cells.length) / 7);
  const grid = Array.from({ length: numWeeks }, () => Array(7).fill(null));

  for (let i = 0; i < cells.length; i += 1) {
    const slot = startWeekday + i;
    grid[Math.floor(slot / 7)][slot % 7] = cells[i];
  }

  const monthPerColumn = grid.map((col) => {
    const first = col.find((c) => c !== null);
    if (!first) return null;
    return dateFromIso(first.date).getMonth();
  });

  const monthLabels = monthPerColumn.map((m, i) => {
    if (m === null || i === 0) return null;
    return m !== monthPerColumn[i - 1] ? MONTH_NAMES[m] : null;
  });

  return { grid, monthLabels };
};

const WorkoutHeatmap = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  const cells = data?.cells ?? [];
  if (cells.length === 0 || (data?.days_with_workout ?? 0) === 0) {
    return (
      <Card style={styles.empty}>
        <Text style={styles.emptyText}>
          Nenhum treino registrado no último ano.
        </Text>
      </Card>
    );
  }

  const { grid, monthLabels } = buildGrid(cells, data.start_date);

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{data.days_with_workout} dias treinados</Text>
        <Text style={styles.label}>{`pico: ${data.max_sessions_in_day}/dia`}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          <View style={styles.monthsRow}>
            <View style={{ width: DAY_LABEL_WIDTH }} />
            {monthLabels.map((label, i) => (
              <View
                key={i}
                style={[styles.monthSlot, { width: CELL_SIZE, marginRight: CELL_GAP }]}
              >
                {label ? <Text style={styles.monthText}>{label}</Text> : null}
              </View>
            ))}
          </View>

          <View style={styles.gridRow}>
            <View style={{ width: DAY_LABEL_WIDTH }}>
              {DAY_ABBR.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.daySlot,
                    { height: CELL_SIZE, marginTop: i === 0 ? 0 : CELL_GAP },
                  ]}
                >
                  {d ? <Text style={styles.dayText}>{d}</Text> : null}
                </View>
              ))}
            </View>

            {grid.map((col, ci) => (
              <View key={ci} style={{ marginRight: CELL_GAP }}>
                {col.map((cell, ri) => (
                  <View
                    key={ri}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: cell
                          ? colorForCount(cell.session_count)
                          : "transparent",
                        marginTop: ri === 0 ? 0 : CELL_GAP,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Menos</Text>
        {INTENSITY_COLORS.map((c, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendLabel}>Mais</Text>
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
  label: {
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  scrollContent: {
    paddingRight: spacing.sm,
  },
  monthsRow: {
    flexDirection: "row",
    height: MONTH_LABEL_HEIGHT,
    marginBottom: 2,
  },
  monthSlot: {
    height: MONTH_LABEL_HEIGHT,
    justifyContent: "center",
  },
  monthText: {
    fontSize: 9,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  daySlot: {
    justifyContent: "center",
  },
  dayText: {
    fontSize: 9,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
    gap: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: colors.textSubtle,
    fontWeight: "600",
    marginHorizontal: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default WorkoutHeatmap;
