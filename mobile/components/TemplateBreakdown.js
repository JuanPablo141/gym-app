import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const TemplateBreakdown = ({ breakdown, totalSessions }) => {
  if (!breakdown || breakdown.length === 0) {
    return (
      <Card style={styles.empty}>
        <Text style={styles.emptyText}>
          Nenhum treino registrado no período.
        </Text>
      </Card>
    );
  }

  const maxCount = Math.max(...breakdown.map((b) => b.session_count), 1);

  return (
    <Card>
      {breakdown.map((row, idx) => {
        const name = row.template_name ?? "Treino livre";
        const isFree = !row.template_name;
        const pct = row.session_count / maxCount;
        const sharePct = totalSessions
          ? Math.round((row.session_count / totalSessions) * 100)
          : 0;
        return (
          <View
            key={row.template_id ?? `free-${idx}`}
            style={[styles.row, idx > 0 && styles.rowDivider]}
          >
            <View style={styles.headerRow}>
              <View style={styles.nameWrap}>
                {isFree && (
                  <Ionicons
                    name="flash-outline"
                    size={14}
                    color={colors.textSubtle}
                    style={styles.icon}
                  />
                )}
                <Text style={styles.name}>{name}</Text>
              </View>
              <Text style={styles.count}>
                {row.session_count}x
                <Text style={styles.share}>{` · ${sharePct}%`}</Text>
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${pct * 100}%` }]}
              />
            </View>
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  empty: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSubtle,
    fontSize: 13,
  },
  row: {
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs + 2,
  },
  nameWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  count: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  share: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSubtle,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});

export default TemplateBreakdown;
