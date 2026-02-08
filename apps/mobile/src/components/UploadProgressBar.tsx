import { View, Text } from "react-native";

interface UploadProgressBarProps {
  progress: number;
  visible: boolean;
  label?: string;
}

export default function UploadProgressBar({ progress, visible, label }: UploadProgressBarProps) {
  if (!visible) return null;

  return (
    <View className="px-4 py-3 bg-blue-50 border-b border-blue-100">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-xs font-medium text-blue-700">{label || "Uploading..."}</Text>
        <Text className="text-xs font-semibold text-blue-700">{progress}%</Text>
      </View>
      <View className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
        <View
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}
