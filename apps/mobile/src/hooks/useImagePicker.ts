import { useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

interface PickerResult {
  uri: string;
  width: number;
  height: number;
  fileName: string;
  mimeType: string;
}

export function useImagePicker() {
  const [loading, setLoading] = useState(false);

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to take photos.");
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Photo library access is needed.");
      return false;
    }
    return true;
  };

  const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  };

  const processResult = async (result: ImagePicker.ImagePickerResult): Promise<PickerResult | null> => {
    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const compressedUri = await compressImage(asset.uri);
    const fileName = asset.fileName || `photo_${Date.now()}.jpg`;

    return {
      uri: compressedUri,
      width: asset.width,
      height: asset.height,
      fileName,
      mimeType: asset.mimeType || "image/jpeg",
    };
  };

  const pickFromCamera = async (): Promise<PickerResult | null> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
      });
      return await processResult(result);
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to capture photo.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async (): Promise<PickerResult | null> => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
        allowsMultipleSelection: false,
      });
      return await processResult(result);
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Error", "Failed to select photo.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const showPickerOptions = (): Promise<PickerResult | null> => {
    return new Promise((resolve) => {
      Alert.alert("Add Photo", "Choose a source", [
        { text: "Take Photo", onPress: async () => resolve(await pickFromCamera()) },
        { text: "Choose from Library", onPress: async () => resolve(await pickFromGallery()) },
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
      ]);
    });
  };

  return { pickFromCamera, pickFromGallery, showPickerOptions, loading };
}
