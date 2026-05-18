import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MuscleGroupCard = ({ group, count, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: group.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={group.icon} size={32} color="#fff" />
      </View>
      <Text style={styles.label}>{group.label}</Text>
      {typeof count === "number" && (
        <Text style={styles.count}>{count} exercícios</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 14,
    padding: 14,
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  count: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
});

export default MuscleGroupCard;
