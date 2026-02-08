import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  STATE: { bg: "bg-purple-100", text: "text-purple-700" },
  COUNTY: { bg: "bg-amber-100", text: "text-amber-700" },
  CITY: { bg: "bg-blue-100", text: "text-blue-700" },
  TOWNSHIP: { bg: "bg-green-100", text: "text-green-700" },
  VILLAGE: { bg: "bg-pink-100", text: "text-pink-700" },
  BOROUGH: { bg: "bg-teal-100", text: "text-teal-700" },
  TOWN: { bg: "bg-indigo-100", text: "text-indigo-700" },
  DISTRICT: { bg: "bg-orange-100", text: "text-orange-700" },
};

const TYPE_LABELS: Record<string, string> = {
  STATE: "State",
  COUNTY: "County",
  CITY: "City",
  TOWNSHIP: "Township",
  VILLAGE: "Village",
  BOROUGH: "Borough",
  TOWN: "Town",
  DISTRICT: "District",
};

interface Jurisdiction {
  id: string;
  name: string;
  type: string;
  state: string;
  county: string | null;
  phone: string | null;
  isVerified: boolean;
  parent: { id: string; name: string; type: string } | null;
  _count: { children: number; properties: number; permits: number };
}

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function JurisdictionsScreen() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchJurisdictions = useCallback(
    async (resetPage = false) => {
      try {
        const currentPage = resetPage ? 1 : page;
        const response = await api.get("/jurisdictions", {
          params: {
            search: searchQuery || undefined,
            state: selectedState || undefined,
            page: currentPage,
            pageSize: 20,
          },
        });

        const data = response.data;
        const newJurisdictions: Jurisdiction[] = data.jurisdictions || [];
        const paginationData: PaginationData | undefined = data.pagination;

        if (resetPage) {
          setJurisdictions(newJurisdictions);
          setPage(1);
        } else {
          setJurisdictions((prev) => [...prev, ...newJurisdictions]);
        }

        if (paginationData) {
          setPagination(paginationData);
          setHasMore(currentPage < paginationData.totalPages);
        } else {
          setHasMore(newJurisdictions.length === 20);
        }
      } catch (error: any) {
        console.error("Failed to fetch jurisdictions:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedState, page]
  );

  useEffect(() => {
    setLoading(true);
    fetchJurisdictions(true);
  }, [searchQuery, selectedState]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchJurisdictions(true);
  }, [fetchJurisdictions]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchJurisdictions(false);
    }
  }, [loading, hasMore, fetchJurisdictions]);

  const toggleState = useCallback((state: string) => {
    setSelectedState((prev) => (prev === state ? null : state));
  }, []);

  const getTypeStyle = (type: string) => {
    return TYPE_COLORS[type] || { bg: "bg-neutral-100", text: "text-neutral-700" };
  };

  const renderJurisdictionCard = ({ item }: { item: Jurisdiction }) => {
    const typeStyle = getTypeStyle(item.type);

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 mx-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={() => router.push(`/jurisdictions/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Name & Verified */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1 mr-2">
            <Text
              className="text-base font-bold text-neutral-900 flex-1"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.isVerified && (
              <View className="ml-2">
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            )}
          </View>
        </View>

        {/* Type Badge + Location */}
        <View className="flex-row items-center flex-wrap mb-2">
          <View className={`${typeStyle.bg} rounded-full px-2.5 py-1 mr-2`}>
            <Text className={`text-xs font-semibold ${typeStyle.text}`}>
              {TYPE_LABELS[item.type] || item.type}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={13} color="#6B7280" />
            <Text className="text-xs text-neutral-500 ml-1">
              {item.state}
              {item.county ? ` - ${item.county} County` : ""}
            </Text>
          </View>
        </View>

        {/* Phone */}
        {item.phone && (
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={13} color="#6B7280" />
            <Text className="text-xs text-neutral-500 ml-1">{item.phone}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16">
      <Ionicons name="business-outline" size={48} color="#D1D5DB" />
      <Text className="text-base text-neutral-400 mt-3">
        No jurisdictions found
      </Text>
      <Text className="text-sm text-neutral-400 mt-1">
        {selectedState
          ? "Try selecting a different state"
          : "Try adjusting your search"}
      </Text>
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
      <SafeAreaView
        className="flex-1 bg-neutral-50 items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-neutral-400 mt-3">
          Loading jurisdictions...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-neutral-200">
        <Text className="text-xl font-bold text-neutral-900 mb-3">
          Jurisdictions
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-200">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-neutral-900"
            placeholder="Search jurisdictions..."
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

      {/* State Chips */}
      <View className="bg-white border-b border-neutral-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {US_STATES.map((state) => (
            <TouchableOpacity
              key={state}
              className={`rounded-full px-4 py-2 ${
                selectedState === state ? "bg-blue-600" : "bg-neutral-100"
              }`}
              onPress={() => toggleState(state)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedState === state ? "text-white" : "text-neutral-700"
                }`}
              >
                {state}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      {pagination && (
        <View className="px-4 py-2">
          <Text className="text-xs text-neutral-500">
            {pagination.total} jurisdiction{pagination.total !== 1 ? "s" : ""} found
          </Text>
        </View>
      )}

      {/* Jurisdiction List */}
      <FlatList
        data={jurisdictions}
        renderItem={renderJurisdictionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: pagination ? 4 : 12, paddingBottom: 20 }}
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
