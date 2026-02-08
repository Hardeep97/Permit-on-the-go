import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";

const SUBCODE_LABELS: Record<string, string> = {
  BUILDING: "Building",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  FIRE: "Fire Protection",
  ZONING: "Zoning",
  MECHANICAL: "Mechanical",
};

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  GENERAL_LIABILITY: "General Liability",
  WORKERS_COMP: "Workers' Compensation",
  PROFESSIONAL_LIABILITY: "Professional Liability",
};

interface License {
  id: string;
  subcodeType: string;
  licenseNumber: string;
  state: string;
  expiryDate: string;
  isVerified: boolean;
}

interface Insurance {
  id: string;
  type: string;
  provider: string;
  coverageAmount: number;
  expiryDate: string;
}

interface Photo {
  id: string;
  fileUrl: string;
  caption?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

interface Vendor {
  id: string;
  companyName: string;
  description: string;
  isVerified: boolean;
  averageRating: number;
  reviewCount: number;
  specialties: string[];
  serviceAreas: string[];
  website?: string;
  phone?: string;
  licenses: License[];
  insurance: Insurance[];
  photos: Photo[];
  reviews: Review[];
}

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchVendor = useCallback(async () => {
    try {
      const response = await api.get(`/vendors/${id}`);
      setVendor(response.data);
    } catch (error: any) {
      console.error("Failed to fetch vendor:", error);
      if (error.response?.status === 404) {
        Alert.alert("Not Found", "Vendor not found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVendor();
  }, [fetchVendor]);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert("Error", "Please write a comment.");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/vendors/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewModalVisible(false);
      setReviewRating(5);
      setReviewComment("");
      Alert.alert("Success", "Review submitted successfully!");
      fetchVendor();
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, size = 16, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={interactive ? () => setReviewRating(i) : undefined}
          disabled={!interactive}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={size}
            color="#F59E0B"
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>
      );
    }
    return <View className="flex-row">{stars}</View>;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading vendor...</Text>
      </SafeAreaView>
    );
  }

  if (!vendor) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-base text-gray-400 mt-3">Vendor not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-brand-600 font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
          {vendor.companyName}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Profile Header */}
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
          <View className="flex-row items-start">
            {/* Avatar */}
            <View className="w-16 h-16 bg-brand-100 rounded-full items-center justify-center mr-3">
              <Text className="text-2xl font-bold text-brand-600">
                {vendor.companyName.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Company Info */}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-gray-900 flex-1">
                  {vendor.companyName}
                </Text>
                {vendor.isVerified && (
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                )}
              </View>

              {/* Rating */}
              {vendor.reviewCount > 0 && (
                <View className="flex-row items-center mt-1">
                  {renderStars(Math.round(vendor.averageRating), 14)}
                  <Text className="text-sm font-semibold text-gray-700 ml-1">
                    {vendor.averageRating.toFixed(1)}
                  </Text>
                  <Text className="text-xs text-gray-500 ml-1">
                    ({vendor.reviewCount})
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {vendor.description && (
            <Text className="text-sm text-gray-600 mt-3">{vendor.description}</Text>
          )}
        </View>

        {/* Specialties */}
        {vendor.specialties && vendor.specialties.length > 0 && (
          <View
            className="mx-4 mt-3 bg-white rounded-2xl p-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-sm font-bold text-gray-900 mb-2">Specialties</Text>
            <View className="flex-row flex-wrap">
              {vendor.specialties.map((specialty, index) => (
                <View
                  key={index}
                  className="bg-brand-50 rounded-full px-3 py-1.5 mr-2 mb-2"
                >
                  <Text className="text-xs font-medium text-brand-700">
                    {SUBCODE_LABELS[specialty] || specialty}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Service Areas */}
        {vendor.serviceAreas && vendor.serviceAreas.length > 0 && (
          <View
            className="mx-4 mt-3 bg-white rounded-2xl p-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-sm font-bold text-gray-900 mb-2">Service Areas</Text>
            <Text className="text-sm text-gray-600">
              {vendor.serviceAreas.join(", ")}
            </Text>
          </View>
        )}

        {/* Licenses */}
        {vendor.licenses && vendor.licenses.length > 0 && (
          <View className="mx-4 mt-3">
            <Text className="text-sm font-bold text-gray-900 mb-2">Licenses</Text>
            {vendor.licenses.map((license) => (
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
                  {license.isVerified && (
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Insurance */}
        {vendor.insurance && vendor.insurance.length > 0 && (
          <View className="mx-4 mt-3">
            <Text className="text-sm font-bold text-gray-900 mb-2">Insurance</Text>
            {vendor.insurance.map((ins) => (
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
            ))}
          </View>
        )}

        {/* Photos */}
        {vendor.photos && vendor.photos.length > 0 && (
          <View className="mt-3">
            <Text className="text-sm font-bold text-gray-900 mb-2 px-4">Photos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4"
              contentContainerStyle={{ gap: 8 }}
            >
              {vendor.photos.map((photo) => (
                <View
                  key={photo.id}
                  className="w-32 h-32 bg-gray-200 rounded-xl overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  {/* Placeholder for image - would use Image component in production */}
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        <View className="mx-4 mt-3 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-gray-900">Reviews</Text>
            <TouchableOpacity
              className="bg-brand-600 rounded-lg px-3 py-1.5"
              onPress={() => setReviewModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-white">Leave Review</Text>
            </TouchableOpacity>
          </View>

          {vendor.reviews && vendor.reviews.length > 0 ? (
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
                  {renderStars(review.rating, 12)}
                </View>
                <Text className="text-xs text-gray-500 mb-1">
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
                <Text className="text-sm text-gray-700">{review.comment}</Text>
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-8">
              <Ionicons name="chatbubbles-outline" size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 mt-2">No reviews yet</Text>
            </View>
          )}
        </View>

        {/* Contact */}
        {(vendor.website || vendor.phone) && (
          <View
            className="mx-4 mb-4 bg-white rounded-2xl p-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-sm font-bold text-gray-900 mb-2">Contact</Text>
            {vendor.website && (
              <TouchableOpacity
                className="flex-row items-center mb-2"
                onPress={() => Linking.openURL(vendor.website!)}
                activeOpacity={0.7}
              >
                <Ionicons name="globe-outline" size={16} color="#2563EB" />
                <Text className="text-sm text-brand-600 ml-2">{vendor.website}</Text>
              </TouchableOpacity>
            )}
            {vendor.phone && (
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => Linking.openURL(`tel:${vendor.phone}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={16} color="#2563EB" />
                <Text className="text-sm text-brand-600 ml-2">{vendor.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Leave a Review</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Star Rating */}
            <View className="items-center mb-4">
              <Text className="text-sm text-gray-600 mb-2">Your Rating</Text>
              {renderStars(reviewRating, 32, true)}
            </View>

            {/* Comment */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Your Review</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-3 text-sm text-gray-900 mb-4"
              placeholder="Share your experience..."
              placeholderTextColor="#9CA3AF"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center ${
                submittingReview ? "bg-gray-300" : "bg-brand-600"
              }`}
              onPress={handleSubmitReview}
              disabled={submittingReview}
              activeOpacity={0.7}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold">Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
