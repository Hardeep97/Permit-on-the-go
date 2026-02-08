import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType?: string;
  blockLot?: string;
  _count?: {
    permits: number;
    documents: number;
  };
  jurisdiction?: {
    id: string;
    name: string;
    type: string;
  };
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed Use",
  INDUSTRIAL: "Industrial",
};

const typeColors: Record<string, { bg: string; text: string }> = {
  COMMERCIAL: { bg: "#EFF6FF", text: "#2563EB" },
  RESIDENTIAL: { bg: "#ECFDF5", text: "#059669" },
  MIXED_USE: { bg: "#F5F3FF", text: "#7C3AED" },
  INDUSTRIAL: { bg: "#FEF3C7", text: "#D97706" },
};

function PropertyCard({ property, onPress }: { property: Property; onPress: () => void }) {
  const propType = property.propertyType || "";
  const typeLabel = PROPERTY_TYPE_LABELS[propType] || propType || "Unknown";
  const colors = typeColors[propType] || { bg: "#F3F4F6", text: "#6B7280" };
  const permitCount = property._count?.permits || 0;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-base font-bold text-gray-900">
              {property.name}
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons
              name="location-outline"
              size={14}
              color="#9CA3AF"
              style={{ marginRight: 4 }}
            />
            <Text className="text-sm text-gray-500">
              {property.address}, {property.city}, {property.state} {property.zipCode}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>

      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
        <View
          className="rounded-full px-2.5 py-1 mr-2"
          style={{ backgroundColor: colors.bg }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: colors.text }}
          >
            {typeLabel}
          </Text>
        </View>
        <View className="flex-row items-center bg-gray-50 rounded-full px-2.5 py-1">
          <Ionicons
            name="document-text-outline"
            size={12}
            color="#6B7280"
            style={{ marginRight: 4 }}
          />
          <Text className="text-xs font-medium text-gray-600">
            {permitCount} {permitCount === 1 ? "permit" : "permits"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PropertiesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchProperties = useCallback(
    async (search?: string) => {
      try {
        const params: Record<string, unknown> = { pageSize: 100 };
        if (search && search.trim()) {
          params.search = search.trim();
        }
        const response = await api.get("/properties", { params });
        setProperties(response.data.properties || []);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchProperties(text);
    }, 400);
    setSearchTimeout(timeout);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperties(searchQuery);
  }, [fetchProperties, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">Properties</Text>
          <TouchableOpacity
            className="bg-brand-600 rounded-xl px-4 py-2.5 flex-row items-center"
            activeOpacity={0.8}
            onPress={() => router.push("/property/new")}
          >
            <Ionicons
              name="add"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <Ionicons
            name="search-outline"
            size={18}
            color="#9CA3AF"
            style={{ marginRight: 8 }}
          />
          <TextInput
            className="flex-1 text-sm text-gray-900"
            placeholder="Search properties..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                fetchProperties("");
              }}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Properties List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-sm text-gray-400 mt-3">Loading properties...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="business-outline" size={48} color="#D1D5DB" />
              <Text className="text-base text-gray-400 mt-4">No properties found</Text>
              <Text className="text-sm text-gray-300 mt-1">
                Try a different search or add a new property
              </Text>
              <TouchableOpacity
                className="mt-4 bg-brand-600 rounded-xl px-5 py-2.5"
                onPress={() => router.push("/property/new")}
              >
                <Text className="text-white text-sm font-semibold">Add Property</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-brand-600 w-14 h-14 rounded-2xl items-center justify-center"
        style={{
          shadowColor: "#2563EB",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => router.push("/property/new")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
