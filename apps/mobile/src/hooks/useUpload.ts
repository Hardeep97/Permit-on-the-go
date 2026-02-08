import { useState } from "react";
import { Alert } from "react-native";
import api from "@/services/api";

interface UploadOptions {
  uri: string;
  fileName: string;
  mimeType: string;
  endpoint: string;
  extraFields?: Record<string, string>;
}

interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (options: UploadOptions): Promise<UploadResult> => {
    const { uri, fileName, mimeType, endpoint, extraFields } = options;
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: fileName,
        type: mimeType,
      } as any);

      if (extraFields) {
        Object.entries(extraFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.error || "Upload failed. Please try again.";
      Alert.alert("Upload Failed", message);
      return { success: false, error: message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { upload, uploading, progress };
}
