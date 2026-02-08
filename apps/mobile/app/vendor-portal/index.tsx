import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

const SUBCODE_LABELS: Record<string, string> = {
  BUILDING: "Building",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  FIRE: "Fire Protection",
  ZONING: "Zoning",
  MECHANICAL: "Mechanical",
};

const SUBCODE_TYPES = [
  "BUILDING",
  "PLUMBING",
  "ELECTRICAL",
  "FIRE",
  "ZONING",
  "MECHANICAL",
];

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  GENERAL_LIABILITY: "General Liability",
  WORKERS_COMP: "Workers' Compensation",
  PROFESSIONAL_LIABILITY: "Professional Liability",
};

const INSURANCE_TYPES = [
  "GENERAL_LIABILITY",
  "WORKERS_COMP",
  "PROFESSIONAL_LIABILITY",
];

interface Vendor {
  id: string;
  companyName: string;
  description: string;
  isVerified: boolean;
  specialties: string[];
  serviceAreas: string[];
  website?: string;
  averageRating: number;
  reviewCount: number;
  stripeConnectId?: string;
  stripeAccountStatus?: string;
  licenses: any[];
  insurance: any[];
  photos: any[];
  reviews: any[];
}

export default function VendorPortalScreen() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration form state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [serviceAreaInput, setServiceAreaInput] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  // License modal state
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);
  const [licenseSubcode, setLicenseSubcode] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  // Insurance modal state
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [insuranceType, setInsuranceType] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceCoverage, setInsuranceCoverage] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");

  // Photo modal state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");

  const fetchVendorProfile = useCallback(async () => {
    try {
      const response = await api.get("/vendors/me");
      setVendor(response.data);
      setIsRegistering(false);
    } catch (error: any) {
      console.error("Failed to fetch vendor profile:", error);
      if (error.response?.status === 404) {
        setIsRegistering(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorProfile();
  }, [fetchVendorProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVendorProfile();
  }, [fetchVendorProfile]);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const addServiceArea = () => {
    if (serviceAreaInput.trim()) {
      setServiceAreas((prev) => [...prev, serviceAreaInput.trim()]);
      setServiceAreaInput("");
    }
  };

  const removeServiceArea = (index: number) => {
    setServiceAreas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRegisterVendor = async () => {
    if (!companyName.trim()) {
      Alert.alert("Error", "Company name is required.");
      return;
    }

    if (selectedSpecialties.length === 0) {
      Alert.alert("Error", "Please select at least one specialty.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/vendors", {
        companyName: companyName.trim(),
        description: description.trim(),
        specialties: selectedSpecialties,
        serviceAreas,
        website: website.trim() || undefined,
      });
      Alert.alert("Success", "Vendor profile created successfully!");
      fetchVendorProfile();
    } catch (error: any) {
      console.error("Failed to register vendor:", error);
      Alert.alert("Error", "Failed to create vendor profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editCompanyName.trim()) {
      Alert.alert("Error", "Company name is required.");
      return;
    }

    try {
      await api.patch(`/vendors/${vendor?.id}`, {
        companyName: editCompanyName.trim(),
        description: editDescription.trim(),
        website: editWebsite.trim() || undefined,
      });
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
      fetchVendorProfile();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleAddLicense = async () => {
    if (!licenseSubcode || !licenseNumber.trim() || !licenseState.trim() || !licenseExpiry.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      await api.post(`/vendors/${vendor?.id}/licenses`, {
        subcodeType: licenseSubcode,
        licenseNumber: licenseNumber.trim(),
        state: licenseState.trim(),
        expiryDate: licenseExpiry.trim(),
        documentUrl: "", // Would upload file in production
      });
      setLicenseModalVisible(false);
      setLicenseSubcode("");
      setLicenseNumber("");
      setLicenseState("");
      setLicenseExpiry("");
      Alert.alert("Success", "License added successfully!");
      fetchVendorProfile();
    } catch (error: any) {
      console.error("Failed to add license:", error);
      Alert.alert("Error", "Failed to add license. Please try again.");
    }
  };

  const handleDeleteLicense = async (licenseId: string) => {
    Alert.alert("Delete License", "Are you sure you want to delete this license?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/vendors/${vendor?.id}/licenses/${licenseId}`);
            Alert.alert("Success", "License deleted successfully!");
            fetchVendorProfile();
          } catch (error: any) {
            console.error("Failed to delete license:", error);
            Alert.alert("Error", "Failed to delete license.");
          }
        },
      },
    ]);
  };

  const handleAddInsurance = async () => {
    if (!insuranceType || !insuranceProvider.trim() || !insuranceCoverage.trim() || !insuranceExpiry.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      await api.post(`/vendors/${vendor?.id}/insurance`, {
        type: insuranceType,
        provider: insuranceProvider.trim(),
        coverageAmount: parseFloat(insuranceCoverage),
        expiryDate: insuranceExpiry.trim(),
        documentUrl: "", // Would upload file in production
      });
      setInsuranceModalVisible(false);
      setInsuranceType("");
      setInsuranceProvider("");
      setInsuranceCoverage("");
      setInsuranceExpiry("");
      Alert.alert("Success", "Insurance added successfully!");
      fetchVendorProfile();
    } catch (error: any) {
      console.error("Failed to add insurance:", error);
      Alert.alert("Error", "Failed to add insurance. Please try again.");
    }
  };

  const handleDeleteInsurance = async (insuranceId: string) => {
    Alert.alert("Delete Insurance", "Are you sure you want to delete this insurance?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/vendors/${vendor?.id}/insurance/${insuranceId}`);
            Alert.alert("Success", "Insurance deleted successfully!");
            fetchVendorProfile();
          } catch (error: any) {
            console.error("Failed to delete insurance:", error);
            Alert.alert("Error", "Failed to delete insurance.");
          }
        },
      },
    ]);
  };

  const handleAddPhoto = async () => {
    if (!photoUrl.trim()) {
      Alert.alert("Error", "Photo URL is required.");
      return;
    }

    try {
      await api.post(`/vendors/${vendor?.id}/photos`, {
        fileUrl: photoUrl.trim(),
        caption: photoCaption.trim() || undefined,
      });
      setPhotoModalVisible(false);
      setPhotoUrl("");
      setPhotoCaption("");
      Alert.alert("Success", "Photo added successfully!");
      fetchVendorProfile();
    } catch (error: any) {
      console.error("Failed to add photo:", error);
      Alert.alert("Error", "Failed to add photo. Please try again.");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/vendors/${vendor?.id}/photos/${photoId}`);
            Alert.alert("Success", "Photo deleted successfully!");
            fetchVendorProfile();
          } catch (error: any) {
            console.error("Failed to delete photo:", error);
            Alert.alert("Error", "Failed to delete photo.");
          }
        },
      },
    ]);
  };

  const handleConnectStripe = async () => {
    try {
      const response = await api.post(`/vendors/${vendor?.id}/stripe`);
      const { url } = response.data;
      if (url) {
        await Linking.openURL(url);
      }
    } catch (error: any) {
      console.error("Failed to connect Stripe:", error);
      Alert.alert("Error", "Failed to connect Stripe. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading vendor portal...</Text>
      </SafeAreaView>
    );
  }

  // Registration View
  if (isRegistering) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Become a Vendor</Text>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="mt-4">
            {/* Company Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Company Name *
              </Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-sm text-gray-900 border border-gray-200"
                placeholder="Enter company name"
                placeholderTextColor="#9CA3AF"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Description</Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-sm text-gray-900 border border-gray-200"
                placeholder="Tell customers about your business"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
              />
            </View>

            {/* Specialties */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Specialties *
              </Text>
              <View className="flex-row flex-wrap">
                {SUBCODE_TYPES.map((subcode) => (
                  <TouchableOpacity
                    key={subcode}
                    className={`rounded-full px-4 py-2 mr-2 mb-2 ${
                      selectedSpecialties.includes(subcode)
                        ? "bg-brand-600"
                        : "bg-gray-200"
                    }`}
                    onPress={() => toggleSpecialty(subcode)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedSpecialties.includes(subcode)
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {SUBCODE_LABELS[subcode]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Areas */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Service Areas
              </Text>
              <View className="flex-row mb-2">
                <TextInput
                  className="flex-1 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 border border-gray-200 mr-2"
                  placeholder="Add a city or state"
                  placeholderTextColor="#9CA3AF"
                  value={serviceAreaInput}
                  onChangeText={setServiceAreaInput}
                />
                <TouchableOpacity
                  className="bg-brand-600 rounded-xl px-4 items-center justify-center"
                  onPress={addServiceArea}
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
              </View>
              {serviceAreas.length > 0 && (
                <View className="flex-row flex-wrap">
                  {serviceAreas.map((area, index) => (
                    <View
                      key={index}
                      className="bg-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2 flex-row items-center"
                    >
                      <Text className="text-sm text-gray-700 mr-1">{area}</Text>
                      <TouchableOpacity onPress={() => removeServiceArea(index)}>
                        <Ionicons name="close-circle" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Website */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Website</Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-sm text-gray-900 border border-gray-200"
                placeholder="https://example.com"
                placeholderTextColor="#9CA3AF"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center mb-8 ${
                submitting ? "bg-gray-300" : "bg-brand-600"
              }`}
              onPress={handleRegisterVendor}
              disabled={submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold">Create Vendor Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Management View
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Vendor Portal</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Profile Card */}
        <View
          className="mx-4 mt-4 bg-white rounded-2xl p-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-gray-900 flex-1">
                  {vendor?.companyName}
                </Text>
                {vendor?.isVerified && (
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                )}
              </View>
              {vendor && vendor.reviewCount > 0 && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text className="text-sm font-semibold text-gray-700 ml-1">
                    {vendor.averageRating.toFixed(1)}
                  </Text>
                  <Text className="text-xs text-gray-500 ml-1">
                    ({vendor.reviewCount})
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              className="bg-brand-600 rounded-lg px-3 py-1.5"
              onPress={() => {
                setEditCompanyName(vendor?.companyName || "");
                setEditDescription(vendor?.description || "");
                setEditWebsite(vendor?.website || "");
                setEditModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-white">Edit</Text>
            </TouchableOpacity>
          </View>
          {vendor?.description && (
            <Text className="text-sm text-gray-600 mt-2">{vendor.description}</Text>
          )}
        </View>

        {/* Licenses */}
        <View className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-gray-900">Licenses</Text>
            <TouchableOpacity
              className="bg-brand-600 rounded-lg px-3 py-1.5"
              onPress={() => setLicenseModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-white">Add License</Text>
            </TouchableOpacity>
          </View>
          {vendor?.licenses && vendor.licenses.length > 0 ? (
            vendor.licenses.map((license) => (
              <View
                key={license.id}
                className="bg-white rounded-xl p-3 mb-2"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {SUBCODE_LABELS[license.subcodeType] || license.subcodeType}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {license.licenseNumber} • {license.state}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Expires: {new Date(license.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteLicense(license.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-6 bg-white rounded-xl">
              <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-2">No licenses added</Text>
            </View>
          )}
        </View>

        {/* Insurance */}
        <View className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-gray-900">Insurance</Text>
            <TouchableOpacity
              className="bg-brand-600 rounded-lg px-3 py-1.5"
              onPress={() => setInsuranceModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-white">Add Insurance</Text>
            </TouchableOpacity>
          </View>
          {vendor?.insurance && vendor.insurance.length > 0 ? (
            vendor.insurance.map((ins) => (
              <View
                key={ins.id}
                className="bg-white rounded-xl p-3 mb-2"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {INSURANCE_TYPE_LABELS[ins.type] || ins.type}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      Provider: {ins.provider}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Coverage: ${ins.coverageAmount.toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Expires: {new Date(ins.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteInsurance(ins.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-6 bg-white rounded-xl">
              <Ionicons name="shield-outline" size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-2">No insurance added</Text>
            </View>
          )}
        </View>

        {/* Photos */}
        <View className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-gray-900">Photos</Text>
            <TouchableOpacity
              className="bg-brand-600 rounded-lg px-3 py-1.5"
              onPress={() => setPhotoModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-white">Add Photo</Text>
            </TouchableOpacity>
          </View>
          {vendor?.photos && vendor.photos.length > 0 ? (
            <View className="flex-row flex-wrap">
              {vendor.photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  className="w-24 h-24 bg-gray-200 rounded-xl mr-2 mb-2 overflow-hidden relative"
                  onLongPress={() => handleDeletePhoto(photo.id)}
                  activeOpacity={0.7}
                >
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                  </View>
                  <View className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-6 bg-white rounded-xl">
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-2">No photos added</Text>
            </View>
          )}
        </View>

        {/* Reviews */}
        <View className="mx-4 mt-4">
          <Text className="text-sm font-bold text-gray-900 mb-2">Reviews</Text>
          {vendor?.reviews && vendor.reviews.length > 0 ? (
            vendor.reviews.map((review) => (
              <View
                key={review.id}
                className="bg-white rounded-xl p-3 mb-2"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {review.reviewerName}
                  </Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? "star" : "star-outline"}
                        size={12}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-1">
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
                <Text className="text-sm text-gray-700">{review.comment}</Text>
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-6 bg-white rounded-xl">
              <Ionicons name="chatbubbles-outline" size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-2">No reviews yet</Text>
            </View>
          )}
        </View>

        {/* Stripe Payments */}
        <View
          className="mx-4 mt-4 mb-8 bg-white rounded-2xl p-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text className="text-sm font-bold text-gray-900 mb-3">Stripe Payments</Text>
          {vendor?.stripeConnectId ? (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text className="text-sm text-gray-700 ml-2">
                  Status: {vendor.stripeAccountStatus || "Connected"}
                </Text>
              </View>
              <TouchableOpacity
                className="bg-brand-600 rounded-xl py-3 items-center mt-2"
                onPress={handleConnectStripe}
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold">View Stripe Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text className="text-sm text-gray-600 mb-3">
                Connect your Stripe account to receive payments from customers.
              </Text>
              <TouchableOpacity
                className="bg-brand-600 rounded-xl py-3 items-center"
                onPress={handleConnectStripe}
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold">Connect with Stripe</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Company Name
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  value={editCompanyName}
                  onChangeText={setEditCompanyName}
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Description
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Website</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  value={editWebsite}
                  onChangeText={setEditWebsite}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <TouchableOpacity
                className="bg-brand-600 rounded-xl py-3.5 items-center"
                onPress={handleUpdateProfile}
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold">Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add License Modal */}
      <Modal
        visible={licenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLicenseModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Add License</Text>
              <TouchableOpacity onPress={() => setLicenseModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  License Type
                </Text>
                <View className="flex-row flex-wrap">
                  {SUBCODE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`rounded-full px-3 py-2 mr-2 mb-2 ${
                        licenseSubcode === type ? "bg-brand-600" : "bg-gray-200"
                      }`}
                      onPress={() => setLicenseSubcode(type)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          licenseSubcode === type ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {SUBCODE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  License Number
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="Enter license number"
                  placeholderTextColor="#9CA3AF"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">State</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="e.g., CA"
                  placeholderTextColor="#9CA3AF"
                  value={licenseState}
                  onChangeText={setLicenseState}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Expiry Date
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={licenseExpiry}
                  onChangeText={setLicenseExpiry}
                />
              </View>

              <TouchableOpacity
                className="bg-brand-600 rounded-xl py-3.5 items-center"
                onPress={handleAddLicense}
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold">Add License</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Insurance Modal */}
      <Modal
        visible={insuranceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInsuranceModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Add Insurance</Text>
              <TouchableOpacity onPress={() => setInsuranceModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Insurance Type
                </Text>
                <View className="flex-row flex-wrap">
                  {INSURANCE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`rounded-full px-3 py-2 mr-2 mb-2 ${
                        insuranceType === type ? "bg-brand-600" : "bg-gray-200"
                      }`}
                      onPress={() => setInsuranceType(type)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          insuranceType === type ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {INSURANCE_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Provider</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="Insurance company name"
                  placeholderTextColor="#9CA3AF"
                  value={insuranceProvider}
                  onChangeText={setInsuranceProvider}
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Coverage Amount
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="e.g., 1000000"
                  placeholderTextColor="#9CA3AF"
                  value={insuranceCoverage}
                  onChangeText={setInsuranceCoverage}
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Expiry Date
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={insuranceExpiry}
                  onChangeText={setInsuranceExpiry}
                />
              </View>

              <TouchableOpacity
                className="bg-brand-600 rounded-xl py-3.5 items-center"
                onPress={handleAddInsurance}
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold">Add Insurance</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Photo Modal */}
      <Modal
        visible={photoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Add Photo</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Photo URL</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor="#9CA3AF"
                value={photoUrl}
                onChangeText={setPhotoUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Caption (optional)
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholder="Add a caption"
                placeholderTextColor="#9CA3AF"
                value={photoCaption}
                onChangeText={setPhotoCaption}
              />
            </View>

            <TouchableOpacity
              className="bg-brand-600 rounded-xl py-3.5 items-center"
              onPress={handleAddPhoto}
              activeOpacity={0.7}
            >
              <Text className="text-white font-bold">Add Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
