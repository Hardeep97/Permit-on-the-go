import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useOfflineCache";

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View className="bg-amber-500 px-4 py-2 flex-row items-center justify-center">
      <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
      <Text className="text-white text-xs font-semibold">You're offline. Some features may be limited.</Text>
    </View>
  );
}
