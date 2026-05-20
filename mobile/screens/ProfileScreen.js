import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import PhotoPicker from "../components/PhotoPicker";
import ProgressPhotoThumbnail from "../components/ProgressPhotoThumbnail";
import { useAuth } from "../src/services/AuthContext";
import { useProgressPhotos } from "../src/services/hooks";
import { formatDate } from "../src/services/format";
import { colors, spacing } from "../src/services/theme";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { data: photos, isLoading, error, refetch } = useProgressPhotos();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.email?.[0] ?? "?").toUpperCase()}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        {(user?.first_name || user?.last_name) && (
          <Text style={styles.name}>
            {[user.first_name, user.last_name].filter(Boolean).join(" ")}
          </Text>
        )}
        <Text style={styles.joined}>Membro desde {formatDate(user?.date_joined)}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Fotos de Progresso</Text>

      <PhotoPicker onUploaded={refetch} />

      {isLoading && (
        <View style={styles.photosLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {error && !isLoading && (
        <Text style={styles.errorText}>Não foi possível carregar suas fotos.</Text>
      )}

      {!isLoading && !error && photos && photos.length > 0 && (
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProgressPhotoThumbnail photo={item} />}
          contentContainerStyle={styles.photosList}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {!isLoading && !error && photos && photos.length === 0 && (
        <Card style={styles.photosEmpty}>
          <Text style={styles.photosEmptyText}>
            Você ainda não registrou fotos de progresso.
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        <Button title="Sair" onPress={logout} variant="secondary" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: spacing.xl + 8,
  },
  userCard: {
    padding: spacing.lg + 4,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: "700",
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  name: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  joined: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textLabel,
    textTransform: "uppercase",
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  photosList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  photosLoading: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  photosEmpty: {
    padding: spacing.xl,
    alignItems: "center",
  },
  photosEmptyText: {
    color: colors.textSubtle,
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
});

export default ProfileScreen;
