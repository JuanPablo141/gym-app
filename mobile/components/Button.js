import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

const Button = ({ title, onPress, loading = false, disabled = false, variant = "primary" }) => {
  const isDisabled = loading || disabled;
  const containerStyle = [
    styles.base,
    variant === "primary" ? styles.primary : styles.secondary,
    isDisabled && styles.disabled,
  ];
  const textStyle = [
    styles.text,
    variant === "primary" ? styles.textPrimary : styles.textSecondary,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#1f6feb"} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#1f6feb",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1f6feb",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  textPrimary: {
    color: "#fff",
  },
  textSecondary: {
    color: "#1f6feb",
  },
});

export default Button;
