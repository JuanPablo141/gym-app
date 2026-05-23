import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { formatDate, formatDuration } from "../src/services/format";
import { colors, spacing } from "../src/services/theme";

const formatVolume = (kg) => {
  const v = Number(kg ?? 0);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)}kg`;
};

const SessionListCard = ({ session, onPress }) => {
  const setLogs = session.set_logs ?? [];
  const exercisesCount = new Set(
    setLogs.map((s) => s.exercise_detail?.id).filter(Boolean)
  ).size;
  const setsCount = setLogs.length;
  const volumeKg = setLogs.reduce(
    (acc, s) => acc + (Number(s.weight_kg) || 0) * (s.reps || 0),
    0
  );
  const templateName = session.template_name ?? "Treino livre";
  const isFree = !session.template_name;

  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          {isFree && (
            <Ionicons
              name="flash-outline"
              size={14}
              color={colors.textSubtle}
              style={styles.icon}
            />
          )}
          <Text style={styles.title} numberOfLines={1}>
            {templateName}
          </Text>
        </View>
        <Text style={styles.volume}>{formatVolume(volumeKg)}</Text>
      </View>
      <Text style={styles.date}>{formatDate(session.started_at)}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={colors.textSubtle} />
          <Text style={styles.metaText}>{formatDuration(session.duration_minutes)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="barbell-outline" size={13} color={colors.textSubtle} />
          <Text style={styles.metaText}>{`${exercisesCount} exerc.`}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="repeat-outline" size={13} color={colors.textSubtle} />
          <Text style={styles.metaText}>{`${setsCount} séries`}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  volume: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: "600",
  },
});

export default SessionListCard;
