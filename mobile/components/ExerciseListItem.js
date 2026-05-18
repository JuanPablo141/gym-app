import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import { colors, spacing } from "../src/services/theme";

const ExerciseListItem = ({ exercise, onPress }) => {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.group}>
            {MUSCLE_GROUP_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  textWrap: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  group: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 2,
  },
});

export default ExerciseListItem;
