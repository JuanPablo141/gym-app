import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const TemplateCard = ({ template, onPress, onLongPress, onStart, onEdit }) => {
  const exerciseCount = template.exercises?.length ?? 0;

  return (
    <Card onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{template.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{exerciseCount}</Text>
          <Text style={styles.countLabel}>exerc.</Text>
        </View>
      </View>
      {template.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {template.description}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onStart}>
          <Ionicons name="play-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Iniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  countText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  countLabel: {
    color: colors.surface,
    fontSize: 9,
    textTransform: "uppercase",
    opacity: 0.85,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
});

export default TemplateCard;
