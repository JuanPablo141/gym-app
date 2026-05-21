import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../src/services/theme";

const NextUpPreview = ({ icon = "arrow-forward", label, title, subtitle }) => {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={18} color={colors.textSubtle} />
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  text: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  label: {
    fontSize: 10,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});

export default NextUpPreview;
