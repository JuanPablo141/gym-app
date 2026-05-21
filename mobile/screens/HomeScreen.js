import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import TodaysWorkoutCard from "../components/TodaysWorkoutCard";
import { DAY_NAMES, getLocalPythonWeekday } from "../src/services/format";
import { useScheduledToday } from "../src/services/hooks";
import { useAuth } from "../src/services/AuthContext";
import { colors, spacing } from "../src/services/theme";

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const today = useScheduledToday();

  useFocusEffect(
    useCallback(() => {
      today.refetch();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleStartScheduled = useCallback(
    (templateId) => {
      navigation.navigate("Templates", {
        screen: "GuidedWorkout",
        params: { templateId },
      });
    },
    [navigation]
  );

  const handleEditSchedule = useCallback(() => {
    navigation.navigate("Schedule");
  }, [navigation]);

  const dayName = DAY_NAMES[getLocalPythonWeekday()];
  const hasSchedules = today.data && today.data.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Olá, {user?.first_name || user?.email?.split("@")[0] || "atleta"}!
        </Text>
        <Text style={styles.subtitle}>{dayName}, vamos treinar?</Text>
      </View>

      <TodaysWorkoutCard
        schedules={today.data}
        onStart={handleStartScheduled}
        onEditSchedule={handleEditSchedule}
      />

      {hasSchedules && (
        <View style={styles.editScheduleWrapper}>
          <Button
            title="Editar agenda"
            onPress={handleEditSchedule}
            variant="secondary"
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  editScheduleWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
});

export default HomeScreen;
