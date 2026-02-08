import { useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";

interface DocumentResult {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export function useDocumentPicker() {
  const [loading, setLoading] = useState(false);

  const pickDocument = async (): Promise<DocumentResult | null> => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];

      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert("File Too Large", "Documents must be under 10MB.");
        return null;
      }

      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size || 0,
        mimeType: asset.mimeType || "application/octet-stream",
      };
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to select document.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { pickDocument, loading };
}
