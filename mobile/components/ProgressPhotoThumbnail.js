import { Image, StyleSheet, Text, View } from "react-native";
import { formatDate } from "../src/services/format";
import { colors, radii, spacing } from "../src/services/theme";

const ProgressPhotoThumbnail = ({ photo }) => {
  const date = photo.taken_at ?? photo.created_at;

  return (
    <View style={styles.wrapper}>
      <Image source={{ uri: photo.image }} style={styles.image} />
      <Text style={styles.date}>{formatDate(date, { withYear: false })}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 100,
    marginRight: spacing.sm + 2,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 130,
    borderRadius: radii.sm,
    backgroundColor: colors.divider,
  },
  date: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default ProgressPhotoThumbnail;
