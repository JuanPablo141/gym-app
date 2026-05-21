import { StyleSheet, TouchableOpacity, View } from "react-native";

const Card = ({ children, onPress, onLongPress, style }) => {
  const isInteractive = onPress || onLongPress;
  const Container = isInteractive ? TouchableOpacity : View;
  const containerProps = isInteractive
    ? { onPress, onLongPress, activeOpacity: 0.7 }
    : {};

  return (
    <Container style={[styles.card, style]} {...containerProps}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default Card;
