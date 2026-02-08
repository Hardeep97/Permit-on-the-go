import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";
import StatusBadge from "@/components/StatusBadge";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed Use",
  INDUSTRIAL: "Industrial",
};

const SUBCODE_LABELS: Record<string, string> = {
  BUILDING: "Building",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  FIRE: "Fire Protection",
  ZONING: "Zoning",
  MECHANICAL: "Mechanical",
};

const typeColors: Record<string, { bg: string; text: string }> = {
  RESIDENTIAL: { bg: "#ECFDF5", text: "#059669" },
  COMMERCIAL: { bg: "#EFF6FF", text: "#2563EB" },
  MIXED_USE: { bg: "#F5F3FF", text: "#7C3AED" },
  INDUSTRIAL: { bg: "#FEF3C7", text: "#D97706" },
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperty = useCallback(async () => {
    try {
      const response = await api.get(`/properties/${id}`);
      setProperty(response.data);
    } catch (error: any) {
      console.error("Failed to fetch property:", error);
      if (error.response?.status === 404) {
        Alert.alert("Not Found", "Property not found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperty();
  }, [fetchProperty]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading property...</Text>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-base text-gray-400 mt-3">Property not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-brand-600 font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const propTypeStyle = typeColors[property.propertyType] || { bg: "#F3F4F6", text: "#6B7280" };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
          {property.name}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Property Info Card */}
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
          {/* Address row */}
          <View className="flex-row items-start mb-3 pb-3 border-b border-gray-100">
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="location-outline" size={20} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">{property.name}</Text>
              <Text className="text-sm text-gray-500 mt-0.5">
                {property.address}
              </Text>
              <Text className="text-sm text-gray-500">
                {property.city}, {property.state} {property.zipCode}
              </Text>
            </View>
          </View>

          {/* Details grid */}
          <View className="flex-row flex-wrap">
            {/* Property Type */}
            <View className="w-1/2 mb-3 pr-2">
              <Text className="text-xs text-gray-500">Type</Text>
              <View className="flex-row items-center mt-0.5">
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: propTypeStyle.bg }}
                >
                  <Text className="text-xs font-semibold" style={{ color: propTypeStyle.text }}>
                    {PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType || "--"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Block/Lot */}
            <View className="w-1/2 mb-3 pl-2">
              <Text className="text-xs text-gray-500">Block / Lot</Text>
              <Text className="text-sm font-medium text-gray-900">
                {property.blockLot || "--"}
              </Text>
            </View>

            {/* Year Built */}
            <View className="w-1/2 mb-3 pr-2">
              <Text className="text-xs text-gray-500">Year Built</Text>
              <Text className="text-sm font-medium text-gray-900">
                {property.yearBuilt || "--"}
              </Text>
            </View>

            {/* Square Feet */}
            <View className="w-1/2 mb-3 pl-2">
              <Text className="text-xs text-gray-500">Square Feet</Text>
              <Text className="text-sm font-medium text-gray-900">
                {property.squareFeet
                  ? new Intl.NumberFormat().format(property.squareFeet)
                  : "--"}
              </Text>
            </View>

            {/* Units */}
            {property.units ? (
              <View className="w-1/2 pr-2">
                <Text className="text-xs text-gray-500">Units</Text>
                <Text className="text-sm font-medium text-gray-900">{property.units}</Text>
              </View>
            ) : null}

            {/* County */}
            {property.county ? (
              <View className="w-1/2 pl-2">
                <Text className="text-xs text-gray-500">County</Text>
                <Text className="text-sm font-medium text-gray-900">{property.county}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Jurisdiction Info */}
        {property.jurisdiction && (
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
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
              <Text className="text-sm font-bold text-gray-900">Jurisdiction</Text>
            </View>
            <Text className="text-sm text-gray-700">{property.jurisdiction.name}</Text>
            {property.jurisdiction.type && (
              <Text className="text-xs text-gray-500 mt-0.5">
                Type: {property.jurisdiction.type}
              </Text>
            )}
            {property.jurisdiction.phone && (
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="call-outline" size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text className="text-xs text-gray-500">{property.jurisdiction.phone}</Text>
              </View>
            )}
            {property.jurisdiction.email && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="mail-outline" size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text className="text-xs text-gray-500">{property.jurisdiction.email}</Text>
              </View>
            )}
          </View>
        )}

        {/* Permits for this property */}
        <View className="px-4 mt-4 mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">Permits</Text>
            <View className="bg-gray-100 rounded-full px-2.5 py-1">
              <Text className="text-xs font-medium text-gray-600">
                {property._count?.permits || property.permits?.length || 0}
              </Text>
            </View>
          </View>
        </View>

        {property.permits && property.permits.length > 0 ? (
          <View className="px-4 pb-4">
            {property.permits.map((permit: any) => (
              <TouchableOpacity
                key={permit.id}
                className="bg-white rounded-xl p-4 mb-2"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
                activeOpacity={0.7}
                onPress={() => router.push(`/permit/${permit.id}`)}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {permit.title}
                    </Text>
                    <View className="flex-row items-center mt-1.5">
                      <Ionicons name="layers-outline" size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                      <Text className="text-xs text-gray-500">
                        {SUBCODE_LABELS[permit.subcodeType] || permit.subcodeType}
                      </Text>
                      <Text className="text-xs text-gray-400 ml-3">
                        {new Date(permit.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={permit.status?.toLowerCase()} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-8">
            <Ionicons name="document-text-outline" size={36} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-2">No permits for this property</Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB - New Permit */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-brand-600 rounded-2xl px-5 py-3.5 flex-row items-center"
        style={{
          shadowColor: "#2563EB",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => router.push("/permit/new")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text className="text-white font-bold text-sm">New Permit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
