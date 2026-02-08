import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
}

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Account",
    items: [
      {
        id: "subscription",
        label: "Subscription",
        icon: "card-outline",
        subtitle: "Manage your plan",
        badge: "Free",
        badgeColor: "#2563EB",
        onPress: () => {},
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "notifications-outline",
        subtitle: "Push notification settings",
        onPress: () => {},
      },
    ],
  },
  {
    title: "Services",
    items: [
      {
        id: "vendor",
        label: "Vendor Portal",
        icon: "storefront-outline",
        subtitle: "Connect with vendors",
        onPress: () => {},
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        id: "help",
        label: "Help & Support",
        icon: "help-circle-outline",
        subtitle: "FAQs and contact support",
        onPress: () => {},
      },
      {
        id: "about",
        label: "About",
        icon: "information-circle-outline",
        subtitle: "Version 0.0.1",
        onPress: () => {},
      },
    ],
  },
];

export default function ProfileScreen() {
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          // TODO: Clear auth state
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="bg-white px-6 pt-6 pb-6 items-center border-b border-gray-100">
          <View className="w-24 h-24 bg-brand-100 rounded-full items-center justify-center mb-4">
            <Text className="text-3xl font-bold text-brand-600">JD</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">John Doe</Text>
          <Text className="text-sm text-gray-500 mt-1">
            john.doe@example.com
          </Text>
          <View className="flex-row items-center mt-3">
            <View className="bg-brand-50 border border-brand-200 rounded-full px-3 py-1">
              <Text className="text-xs font-semibold text-brand-600">
                Free Plan
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="mt-4 bg-brand-600 rounded-xl px-6 py-2.5"
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-semibold">
              Upgrade to Annual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} className="mt-6">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 mb-2">
              {section.title}
            </Text>
            <View
              className="bg-white mx-4 rounded-2xl overflow-hidden shadow-sm"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  className={`flex-row items-center px-4 py-3.5 ${
                    index < section.items.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <View className="w-9 h-9 bg-gray-50 rounded-xl items-center justify-center mr-3">
                    <Ionicons name={item.icon} size={20} color="#6B7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text className="text-xs text-gray-500 mt-0.5">
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  {item.badge && (
                    <View
                      className="rounded-full px-2.5 py-1 mr-2"
                      style={{ backgroundColor: `${item.badgeColor}15` }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: item.badgeColor }}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            className="bg-white rounded-2xl py-3.5 items-center border border-red-100 shadow-sm"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 4,
              elevation: 1,
            }}
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text className="text-sm font-semibold text-red-500">
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
