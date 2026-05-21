import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import DaySection from "../components/DaySection";
import QueryState from "../components/QueryState";
import {
  createSchedule,
  deleteSchedule,
  useScheduledWeek,
} from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const ScheduleScreen = ({ navigation }) => {
  const { data, isLoading, error, refetch } = useScheduledWeek();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const schedulesByDay = (data ?? []).reduce((acc, sched) => {
    if (!acc[sched.day_of_week]) acc[sched.day_of_week] = [];
    acc[sched.day_of_week].push(sched);
    return acc;
  }, {});

  const handleAdd = useCallback(
    (dayOfWeek) => {
      navigation.navigate("TemplatePicker", {
        onPick: async (template) => {
          try {
            await createSchedule({
              template: template.id,
              day_of_week: dayOfWeek,
              order: (schedulesByDay[dayOfWeek]?.length ?? 0) + 1,
            });
            refetch();
          } catch (err) {
            const detail =
              err?.response?.data?.template?.[0] ??
              err?.response?.data?.detail ??
              "Não foi possível agendar.";
            Alert.alert("Erro", detail);
          }
        },
      });
    },
    [navigation, schedulesByDay, refetch]
  );

  const handleRemove = useCallback(
    (sched) => {
      Alert.alert(
        "Remover do cronograma",
        `Tirar "${sched.template_detail?.name}" deste dia?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteSchedule(sched.id);
                refetch();
              } catch {
                Alert.alert("Erro", "Não foi possível remover.");
              }
            },
          },
        ]
      );
    },
    [refetch]
  );

  return (
    <View style={styles.container}>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        errorText="Não foi possível carregar a agenda."
      >
        <ScrollView contentContainerStyle={styles.content}>
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
            <DaySection
              key={dow}
              dayOfWeek={dow}
              schedules={schedulesByDay[dow] ?? []}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))}
        </ScrollView>
      </QueryState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingVertical: spacing.sm,
  },
});

export default ScheduleScreen;
