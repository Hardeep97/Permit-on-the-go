import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
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

interface Vendor {
  id: string;
  companyName: string;
  description: string;
  isVerified: boolean;
  averageRating: number;
  reviewCount: number;
  specialties: string[];
  serviceAreas: string[];
}

export default function VendorsScreen() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcode, setSelectedSubcode] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchVendors = useCallback(
    async (resetPage = false) => {
      try {
        const currentPage = resetPage ? 1 : page;
        const response = await api.get("/vendors", {
          params: {
            query: searchQuery || undefined,
            subcodeType: selectedSubcode || undefined,
            isVerified: verifiedOnly || undefined,
            page: currentPage,
            pageSize: 12,
          },
        });

        const newVendors = response.data.vendors || response.data;

        if (resetPage) {
          setVendors(newVendors);
          setPage(1);
        } else {
          setVendors((prev) => [...prev, ...newVendors]);
        }

        setHasMore(newVendors.length === 12);
      } catch (error: any) {
        console.error("Failed to fetch vendors:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedSubcode, verifiedOnly, page]
  );

  useEffect(() => {
    setLoading(true);
    fetchVendors(true);
  }, [searchQuery, selectedSubcode, verifiedOnly]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchVendors(true);
  }, [fetchVendors]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchVendors(false);
    }
  }, [loading, hasMore, fetchVendors]);

  const toggleSubcode = (subcode: string) => {
    setSelectedSubcode((prev) => (prev === subcode ? null : subcode));
  };

  const renderVendorCard = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 mx-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={() => router.push(`/vendors/${item.id}`)}
      activeOpacity={0.7}
    >
      {/* Company Name & Verified Badge */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>
              {item.companyName}
            </Text>
            {item.isVerified && (
              <View className="ml-2">
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Rating */}
      {item.reviewCount > 0 && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text className="text-sm font-semibold text-gray-700 ml-1">
            {item.averageRating.toFixed(1)}
          </Text>
          <Text className="text-xs text-gray-500 ml-1">
            ({item.reviewCount} {item.reviewCount === 1 ? "review" : "reviews"})
          </Text>
        </View>
      )}

      {/* Specialties */}
      {item.specialties && item.specialties.length > 0 && (
        <View className="flex-row flex-wrap mb-2">
          {item.specialties.slice(0, 3).map((specialty, index) => (
            <View
              key={index}
              className="bg-brand-50 rounded-full px-2.5 py-1 mr-2 mb-1"
            >
              <Text className="text-xs font-medium text-brand-700">
                {SUBCODE_LABELS[specialty] || specialty}
              </Text>
            </View>
          ))}
          {item.specialties.length > 3 && (
            <View className="bg-gray-100 rounded-full px-2.5 py-1 mb-1">
              <Text className="text-xs font-medium text-gray-600">
                +{item.specialties.length - 3} more
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Service Areas */}
      {item.serviceAreas && item.serviceAreas.length > 0 && (
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
            {item.serviceAreas.slice(0, 3).join(", ")}
            {item.serviceAreas.length > 3 && ` +${item.serviceAreas.length - 3} more`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16">
      <Ionicons name="search-outline" size={48} color="#D1D5DB" />
      <Text className="text-base text-gray-400 mt-3">No vendors found</Text>
      <Text className="text-sm text-gray-400 mt-1">Try adjusting your filters</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">Loading vendors...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-bold text-gray-900">Find Vendors</Text>
          <TouchableOpacity className="p-2">
            <Ionicons name="options-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholder="Search by company name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 px-4 py-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {SUBCODE_TYPES.map((subcode) => (
          <TouchableOpacity
            key={subcode}
            className={`rounded-full px-4 py-2 ${
              selectedSubcode === subcode
                ? "bg-brand-600"
                : "bg-gray-100"
            }`}
            onPress={() => toggleSubcode(subcode)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                selectedSubcode === subcode
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              {SUBCODE_LABELS[subcode]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Verified Only Toggle */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          className="flex-row items-center justify-between"
          onPress={() => setVerifiedOnly(!verifiedOnly)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={verifiedOnly ? "#10B981" : "#9CA3AF"}
            />
            <Text className="text-sm font-medium text-gray-700 ml-2">
              Show verified vendors only
            </Text>
          </View>
          <View
            className={`w-12 h-6 rounded-full ${
              verifiedOnly ? "bg-brand-600" : "bg-gray-300"
            } justify-center`}
          >
            <View
              className={`w-5 h-5 rounded-full bg-white ${
                verifiedOnly ? "ml-6" : "ml-0.5"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Vendor List */}
      <FlatList
        data={vendors}
        renderItem={renderVendorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}
