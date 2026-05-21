import { StyleSheet, View } from "react-native";
import { colors } from "../src/services/theme";

const WorkoutProgressBar = ({ current, total }) => {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.divider,
    width: "100%",
  },
  fill: {
    height: 4,
    backgroundColor: colors.primary,
  },
});

export default WorkoutProgressBar;
