import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import StatusBadge from "@/components/StatusBadge";

interface StatCard {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  onPress: () => void;
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<StatCard[]>([
    {
      label: "Properties",
      value: "--",
      icon: "business-outline",
      color: "#2563EB",
      bgColor: "#EFF6FF",
    },
    {
      label: "Active Permits",
      value: "--",
      icon: "document-text-outline",
      color: "#059669",
      bgColor: "#ECFDF5",
    },
    {
      label: "In Review",
      value: "--",
      icon: "time-outline",
      color: "#D97706",
      bgColor: "#FFFBEB",
    },
  ]);
  const [recentPermits, setRecentPermits] = useState<any[]>([]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get("/notifications", {
        params: { unread: true },
      });
      const data = response.data;
      // Support both array response and paginated response
      if (Array.isArray(data)) {
        setUnreadCount(data.length);
      } else if (data.notifications) {
        setUnreadCount(data.notifications.length);
      } else if (typeof data.count === "number") {
        setUnreadCount(data.count);
      } else if (data.pagination?.total != null) {
        setUnreadCount(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [propsRes, permitsRes, reviewRes] = await Promise.all([
        api.get("/properties", { params: { pageSize: 1 } }).catch(() => null),
        api.get("/permits", { params: { pageSize: 5 } }).catch(() => null),
        api
          .get("/permits", { params: { status: "UNDER_REVIEW", pageSize: 1 } })
          .catch(() => null),
      ]);

      const propertiesTotal = propsRes?.data?.pagination?.total ?? 0;
      const permitsTotal = permitsRes?.data?.pagination?.total ?? 0;
      const reviewTotal = reviewRes?.data?.pagination?.total ?? 0;
      const permits = permitsRes?.data?.permits ?? [];

      setStats([
        {
          label: "Properties",
          value: String(propertiesTotal),
          icon: "business-outline",
          color: "#2563EB",
          bgColor: "#EFF6FF",
        },
        {
          label: "Active Permits",
          value: String(permitsTotal),
          icon: "document-text-outline",
          color: "#059669",
          bgColor: "#ECFDF5",
        },
        {
          label: "In Review",
          value: String(reviewTotal),
          icon: "time-outline",
          color: "#D97706",
          bgColor: "#FFFBEB",
        },
      ]);

      setRecentPermits(permits);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchUnreadCount();
  }, [fetchDashboardData, fetchUnreadCount]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
    fetchUnreadCount();
  }, [fetchDashboardData, fetchUnreadCount]);

  const quickActions: QuickAction[] = [
    {
      label: "Add Property",
      icon: "add-circle-outline",
      color: "#2563EB",
      bgColor: "#EFF6FF",
      onPress: () => router.push("/property/new"),
    },
    {
      label: "New Permit",
      icon: "document-attach-outline",
      color: "#059669",
      bgColor: "#ECFDF5",
      onPress: () => router.push("/permit/new"),
    },
    {
      label: "AI Chat",
      icon: "sparkles-outline",
      color: "#7C3AED",
      bgColor: "#F5F3FF",
      onPress: () => router.push("/(tabs)/chat"),
    },
  ];

  const displayName = user?.name || "there";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6 bg-white">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500">Welcome back,</Text>
              <Text className="text-2xl font-bold text-gray-900 mt-0.5">
                {displayName}
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => router.push("/notifications")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#374151"
              />
              {unreadCount > 0 && (
                <View
                  className="absolute items-center justify-center rounded-full bg-red-500"
                  style={{
                    top: -4,
                    right: -4,
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: 10 }}
                  >
                    {unreadCount > 99 ? "99+" : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row px-4 mt-4 gap-2">
          {stats.map((stat) => (
            <View
              key={stat.label}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: stat.bgColor }}
              >
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              {loading ? (
                <ActivityIndicator size="small" color={stat.color} />
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </Text>
              )}
              <Text className="text-xs text-gray-500 mt-0.5">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                  style={{ backgroundColor: action.bgColor }}
                >
                  <Ionicons
                    name={action.icon}
                    size={24}
                    color={action.color}
                  />
                </View>
                <Text className="text-xs font-semibold text-gray-700 text-center">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Permits */}
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">
              Recent Permits
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/permits")}>
              <Text className="text-sm text-brand-600 font-medium">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <ActivityIndicator size="small" color="#2563EB" />
              <Text className="text-sm text-gray-400 mt-2">Loading...</Text>
            </View>
          ) : recentPermits.length === 0 ? (
            <View
              className="bg-white rounded-2xl p-8 items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={36}
                color="#D1D5DB"
              />
              <Text className="text-sm text-gray-400 mt-2">
                No permits yet
              </Text>
              <TouchableOpacity
                className="mt-3 bg-brand-600 rounded-lg px-4 py-2"
                onPress={() => router.push("/permit/new")}
              >
                <Text className="text-white text-sm font-semibold">
                  Create First Permit
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {recentPermits.map((permit, index) => (
                <TouchableOpacity
                  key={permit.id}
                  className={`flex-row items-center p-4 ${
                    index < recentPermits.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  activeOpacity={0.6}
                  onPress={() => router.push(`/permit/${permit.id}`)}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: "#EFF6FF" }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#2563EB"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold text-gray-900"
                      numberOfLines={1}
                    >
                      {permit.title}
                    </Text>
                    <Text
                      className="text-xs text-gray-500 mt-0.5"
                      numberOfLines={1}
                    >
                      {permit.property?.name || "Property"} --{" "}
                      {new Date(permit.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <StatusBadge status={permit.status?.toLowerCase()} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
