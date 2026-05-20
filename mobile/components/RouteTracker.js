import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import Button from "./Button";
import Card from "./Card";
import { requestLocationPermission, totalDistanceKm } from "../src/services/sensors";
import { colors, spacing } from "../src/services/theme";

const RouteTracker = ({ points, onChange }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!isTracking) return undefined;

    let subscription;
    let cancelled = false;

    (async () => {
      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 5000,
          },
          (loc) => {
            if (cancelled) return;
            const point = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              timestamp: new Date(loc.timestamp).toISOString(),
            };
            onChange((prev) => [...prev, point]);
          }
        );
      } catch (err) {
        Alert.alert("Erro de GPS", "Não foi possível iniciar o rastreamento.");
        setIsTracking(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [isTracking, onChange]);

  const handleStart = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    setIsTracking(true);
  };

  const handleStop = () => {
    setIsTracking(false);
  };

  const distanceKm = totalDistanceKm(points).toFixed(2);

  return (
    <Card>
      <Text style={styles.label}>Rastreamento de Rota</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{distanceKm}</Text>
          <Text style={styles.statUnit}>km</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{points.length}</Text>
          <Text style={styles.statUnit}>pontos</Text>
        </View>
      </View>

      {permissionDenied && (
        <Text style={styles.warning}>
          Permissão de localização negada. Você pode continuar sem rastrear a rota.
        </Text>
      )}

      <View style={styles.buttonWrapper}>
        {isTracking ? (
          <Button title="Parar rastreamento" onPress={handleStop} variant="secondary" />
        ) : (
          <Button title="Iniciar rastreamento" onPress={handleStart} />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textSubtle,
    textTransform: "uppercase",
  },
  buttonWrapper: {
    marginTop: spacing.sm,
  },
  warning: {
    fontSize: 12,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});

export default RouteTracker;
