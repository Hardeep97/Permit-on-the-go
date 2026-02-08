import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";
import StatusBadge from "@/components/StatusBadge";

interface Permit {
  id: string;
  title: string;
  status: string;
  subcodeType: string;
  priority: string;
  createdAt: string;
  submittedAt?: string;
  expiresAt?: string;
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  _count?: {
    documents: number;
    photos: number;
    inspections: number;
  };
}

const FILTER_OPTIONS = [
  { key: "all", label: "All", apiValue: undefined },
  { key: "DRAFT", label: "Draft", apiValue: "DRAFT" },
  { key: "SUBMITTED", label: "Submitted", apiValue: "SUBMITTED" },
  { key: "UNDER_REVIEW", label: "In Review", apiValue: "UNDER_REVIEW" },
  { key: "APPROVED", label: "Approved", apiValue: "APPROVED" },
  { key: "PERMIT_ISSUED", label: "Issued", apiValue: "PERMIT_ISSUED" },
  { key: "CLOSED", label: "Closed", apiValue: "CLOSED" },
] as const;

const subcodeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  BUILDING: "construct-outline",
  ELECTRICAL: "flash-outline",
  PLUMBING: "water-outline",
  MECHANICAL: "cog-outline",
  FIRE: "flame-outline",
  ZONING: "map-outline",
};

const SUBCODE_LABELS: Record<string, string> = {
  BUILDING: "Building",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  FIRE: "Fire Protection",
  ZONING: "Zoning",
  MECHANICAL: "Mechanical",
};

function PermitCard({ permit, onPress }: { permit: Permit; onPress: () => void }) {
  const propertyName = permit.property?.name || "Unknown Property";
  const subcodeLabel = SUBCODE_LABELS[permit.subcodeType] || permit.subcodeType;
  const displayDate = permit.submittedAt || permit.createdAt;

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
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {permit.title}
          </Text>
          <View className="flex-row items-center mt-1.5">
            <Ionicons
              name="business-outline"
              size={13}
              color="#9CA3AF"
              style={{ marginRight: 4 }}
            />
            <Text className="text-sm text-gray-500">{propertyName}</Text>
          </View>
        </View>
        <StatusBadge status={permit.status?.toLowerCase()} />
      </View>

      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center mr-4">
          <Ionicons
            name={subcodeIcons[permit.subcodeType] || "document-outline"}
            size={14}
            color="#6B7280"
            style={{ marginRight: 4 }}
          />
          <Text className="text-xs font-medium text-gray-600">{subcodeLabel}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons
            name="calendar-outline"
            size={14}
            color="#6B7280"
            style={{ marginRight: 4 }}
          />
          <Text className="text-xs text-gray-500">
            {new Date(displayDate).toLocaleDateString()}
          </Text>
        </View>
        {permit.expiresAt && (
          <View className="flex-row items-center ml-4">
            <Ionicons
              name="time-outline"
              size={14}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
            <Text className="text-xs text-gray-500">
              Exp: {new Date(permit.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function PermitsScreen() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPermits = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      try {
        const params: Record<string, unknown> = { page: pageNum, pageSize: 20 };
        const filterOption = FILTER_OPTIONS.find((f) => f.key === activeFilter);
        if (filterOption?.apiValue) {
          params.status = filterOption.apiValue;
        }

        const response = await api.get("/permits", { params });
        const data = response.data;
        const newPermits = data.permits || [];

        if (isRefresh || pageNum === 1) {
          setPermits(newPermits);
        } else {
          setPermits((prev) => [...prev, ...newPermits]);
        }

        const pagination = data.pagination;
        setHasMore(pagination ? pagination.page < pagination.totalPages : false);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch permits:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    setLoading(true);
    setPermits([]);
    fetchPermits(1);
  }, [activeFilter, fetchPermits]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPermits(1, true);
  }, [fetchPermits]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchPermits(page + 1);
    }
  }, [loadingMore, hasMore, page, fetchPermits]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">Permits</Text>
          <TouchableOpacity
            className="bg-brand-600 rounded-xl px-4 py-2.5 flex-row items-center"
            activeOpacity={0.8}
            onPress={() => router.push("/permit/new")}
          >
            <Ionicons
              name="add"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text className="text-white text-sm font-semibold">New</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              className={`rounded-full px-4 py-2 ${
                activeFilter === filter.key
                  ? "bg-brand-600"
                  : "bg-gray-100 border border-gray-200"
              }`}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === filter.key ? "text-white" : "text-gray-600"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Permits List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-sm text-gray-400 mt-3">Loading permits...</Text>
        </View>
      ) : (
        <FlatList
          data={permits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PermitCard
              permit={item}
              onPress={() => router.push(`/permit/${item.id}`)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
              <Text className="text-base text-gray-400 mt-4">No permits found</Text>
              <Text className="text-sm text-gray-300 mt-1">
                Try a different filter or create a new permit
              </Text>
              <TouchableOpacity
                className="mt-4 bg-brand-600 rounded-xl px-5 py-2.5"
                onPress={() => router.push("/permit/new")}
              >
                <Text className="text-white text-sm font-semibold">Create Permit</Text>
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
        onPress={() => router.push("/permit/new")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
