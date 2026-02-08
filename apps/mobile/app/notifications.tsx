import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: {
    permitId?: string;
    [key: string]: any;
  };
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data?.notifications ?? response.data ?? []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleTapNotification = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification.id}`, { read: true });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate to relevant screen
    if (notification.data?.permitId) {
      router.push(`/permit/${notification.data.permitId}`);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      className={`mx-4 mb-2 rounded-xl p-4 ${
        item.read ? "bg-white" : "bg-blue-50"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
      onPress={() => handleTapNotification(item)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Unread indicator */}
        <View className="w-6 items-center pt-1.5">
          {!item.read && (
            <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          )}
        </View>

        <View className="flex-1">
          <Text
            className={`text-sm ${
              item.read
                ? "font-medium text-gray-700"
                : "font-semibold text-gray-900"
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="text-sm text-gray-500 mt-0.5"
            numberOfLines={2}
          >
            {item.body}
          </Text>
          <Text className="text-xs text-gray-400 mt-1.5">
            {timeAgo(item.createdAt)}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color="#D1D5DB"
          style={{ marginTop: 4 }}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-gray-50 items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-400 mt-3">
          Loading notifications...
        </Text>
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
        <Text className="text-lg font-bold text-gray-900 flex-1">
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markingAllRead}
            className="py-1 px-3"
          >
            {markingAllRead ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text className="text-sm font-medium text-brand-600">
                Mark All Read
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#D1D5DB"
            />
            <Text className="text-base text-gray-400 mt-4">
              No notifications yet
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              You'll see updates about your permits here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
