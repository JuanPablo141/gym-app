import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Button from "./Button";
import { uploadProgressPhoto } from "../src/services/hooks";
import {
  requestCameraPermission,
  requestMediaLibraryPermission,
} from "../src/services/sensors";
import { colors, spacing } from "../src/services/theme";

const PhotoPicker = ({ onUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const upload = async (uri) => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      await uploadProgressPhoto({ uri, takenAt: today });
      onUploaded?.();
    } catch {
      setErrorMessage("Falha ao enviar a foto. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const pickFromGallery = async () => {
    const granted = await requestMediaLibraryPermission();
    if (!granted) {
      setErrorMessage("Permissão da galeria negada.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      await upload(result.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      // Fallback elegante para galeria
      return pickFromGallery();
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      await upload(result.assets[0].uri);
    }
  };

  const handlePick = () => {
    Alert.alert("Adicionar foto", "De onde quer importar?", [
      { text: "Câmera", onPress: pickFromCamera },
      { text: "Galeria", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Adicionar foto"
        onPress={handlePick}
        loading={isUploading}
        variant="secondary"
      />
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});

export default PhotoPicker;
