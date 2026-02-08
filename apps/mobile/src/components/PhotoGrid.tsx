import { View, Text, FlatList, Image, TouchableOpacity, Dimensions, Share, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Photo {
  id: string;
  fileUrl: string;
  fileName?: string;
  caption?: string | null;
  stage?: string | null;
  createdAt: string;
  uploadedBy?: { id: string; name: string };
}

interface PhotoGridProps {
  photos: Photo[];
  loading?: boolean;
  onPhotoPress?: (photo: Photo) => void;
  onUploadPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_GAP = 8;
const HORIZONTAL_PADDING = 16;
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  BEFORE: { bg: "#FEF3C7", text: "#D97706" },
  DURING: { bg: "#EFF6FF", text: "#2563EB" },
  AFTER: { bg: "#ECFDF5", text: "#059669" },
  INSPECTION: { bg: "#F5F3FF", text: "#7C3AED" },
};

function PhotoCard({
  photo,
  onPress,
}: {
  photo: Photo;
  onPress?: (photo: Photo) => void;
}) {
  const stageStyle = photo.stage ? STAGE_COLORS[photo.stage] : null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this photo${photo.caption ? `: ${photo.caption}` : ""}`,
        url: photo.fileUrl,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share photo");
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-xl overflow-hidden"
      style={{
        width: ITEM_WIDTH,
        marginBottom: COLUMN_GAP,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.8}
      onPress={() => onPress?.(photo)}
    >
      <View style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, backgroundColor: "#F3F4F6" }}>
        <Image
          source={{ uri: photo.fileUrl }}
          style={{ width: "100%", height: "100%", resizeMode: "cover" }}
        />
        {/* Share button overlay */}
        <TouchableOpacity
          className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5"
          onPress={handleShare}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-outline" size={14} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Stage badge */}
        {stageStyle && photo.stage ? (
          <View
            className="absolute top-2 left-2 rounded-full px-2 py-0.5"
            style={{ backgroundColor: stageStyle.bg }}
          >
            <Text className="text-[10px] font-bold" style={{ color: stageStyle.text }}>
              {photo.stage}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Caption */}
      {photo.caption ? (
        <View className="px-2 py-2">
          <Text className="text-xs text-gray-700" numberOfLines={2}>
            {photo.caption}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function PhotoGrid({ photos, loading, onPhotoPress, onUploadPress }: PhotoGridProps) {
  if (loading) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-sm text-gray-400">Loading photos...</Text>
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Ionicons name="camera-outline" size={40} color="#D1D5DB" />
        <Text className="text-sm text-gray-400 mt-3">No photos yet</Text>
        {onUploadPress ? (
          <TouchableOpacity
            className="mt-4 bg-brand-600 rounded-xl px-5 py-2.5 flex-row items-center"
            onPress={onUploadPress}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text className="text-white text-sm font-semibold">Add Photo</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 16 }}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => <PhotoCard photo={item} onPress={onPhotoPress} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
}
