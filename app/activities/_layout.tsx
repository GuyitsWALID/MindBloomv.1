import { Stack } from 'expo-router';

export default function ActivitiesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="meditation" />
      <Stack.Screen name="energy-boost" />
      <Stack.Screen name="gratitude" />
    </Stack>
  );
}