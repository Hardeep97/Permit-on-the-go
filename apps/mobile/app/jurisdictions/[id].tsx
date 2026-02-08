import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import api from "@/services/api";

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

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface ChildJurisdiction {
  id: string;
  name: string;
  type: string;
  state: string;
  county: string | null;
  isVerified: boolean;
}

interface Jurisdiction {
  id: string;
  name: string;
  type: string;
  state: string;
  county: string | null;
  fips: string | null;
  permitPortalUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  officeHours: Record<string, string> | null;
  fees: Record<string, unknown> | null;
  requirements: string[] | null;
  notes: string | null;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  parent: { id: string; name: string; type: string } | null;
  children: ChildJurisdiction[];
  _count: { properties: number; permits: number };
}

export default function JurisdictionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJurisdiction = useCallback(async () => {
    try {
      const response = await api.get(`/jurisdictions/${id}`);
      setJurisdiction(response.data);
    } catch (error: any) {
      console.error("Failed to fetch jurisdiction:", error);
      if (error.response?.status === 404) {
        Alert.alert("Not Found", "Jurisdiction not found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJurisdiction();
  }, [fetchJurisdiction]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJurisdiction();
  }, [fetchJurisdiction]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Unable to make a phone call on this device.");
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert("Error", "Unable to open email client.");
    });
  };

  const handleOpenUrl = (url: string, label: string) => {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch(() => {
      Alert.alert("Error", `Unable to open ${label}.`);
    });
  };

  const getTypeStyle = (type: string) => {
    return TYPE_COLORS[type] || { bg: "bg-neutral-100", text: "text-neutral-700" };
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-neutral-50 items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-neutral-400 mt-3">
          Loading jurisdiction...
        </Text>
      </SafeAreaView>
    );
  }

  if (!jurisdiction) {
    return (
      <SafeAreaView
        className="flex-1 bg-neutral-50 items-center justify-center"
        edges={["top"]}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-base text-neutral-400 mt-3">
          Jurisdiction not found
        </Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-blue-600 font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const typeStyle = getTypeStyle(jurisdiction.type);
  const hasContact =
    jurisdiction.phone || jurisdiction.email || jurisdiction.websiteUrl || jurisdiction.permitPortalUrl;
  const hasOfficeHours =
    jurisdiction.officeHours && Object.keys(jurisdiction.officeHours).length > 0;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-neutral-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text
          className="text-lg font-bold text-neutral-900 flex-1"
          numberOfLines={1}
        >
          {jurisdiction.name}
        </Text>
      </View>

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
        {/* Name + Type + Verified */}
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
            {/* Icon */}
            <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="business" size={24} color="#2563EB" />
            </View>

            {/* Info */}
            <View className="flex-1">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-lg font-bold text-neutral-900 mr-2">
                  {jurisdiction.name}
                </Text>
                {jurisdiction.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>

              {/* Badges */}
              <View className="flex-row items-center flex-wrap mt-2">
                <View className={`${typeStyle.bg} rounded-full px-2.5 py-1 mr-2`}>
                  <Text className={`text-xs font-semibold ${typeStyle.text}`}>
                    {TYPE_LABELS[jurisdiction.type] || jurisdiction.type}
                  </Text>
                </View>
                <Text className="text-sm text-neutral-500">
                  {jurisdiction.state}
                  {jurisdiction.county ? ` - ${jurisdiction.county} County` : ""}
                </Text>
              </View>

              {/* Parent jurisdiction */}
              {jurisdiction.parent && (
                <TouchableOpacity
                  className="flex-row items-center mt-2"
                  onPress={() => router.push(`/jurisdictions/${jurisdiction.parent!.id}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="git-branch-outline" size={14} color="#6B7280" />
                  <Text className="text-xs text-blue-600 ml-1">
                    Part of {jurisdiction.parent.name}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Verified timestamp */}
              {jurisdiction.isVerified && jurisdiction.lastVerifiedAt && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                  <Text className="text-xs text-neutral-500 ml-1">
                    Verified {new Date(jurisdiction.lastVerifiedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Contact Section */}
        {hasContact && (
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
            <Text className="text-sm font-bold text-neutral-900 mb-3">
              Contact
            </Text>

            {/* Phone */}
            {jurisdiction.phone && (
              <TouchableOpacity
                className="flex-row items-center py-2.5 border-b border-neutral-100"
                onPress={() => handleCall(jurisdiction.phone!)}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 bg-green-50 rounded-full items-center justify-center mr-3">
                  <Ionicons name="call" size={18} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500">Phone</Text>
                  <Text className="text-sm font-medium text-blue-600">
                    {jurisdiction.phone}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* Email */}
            {jurisdiction.email && (
              <TouchableOpacity
                className="flex-row items-center py-2.5 border-b border-neutral-100"
                onPress={() => handleEmail(jurisdiction.email!)}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 bg-blue-50 rounded-full items-center justify-center mr-3">
                  <Ionicons name="mail" size={18} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500">Email</Text>
                  <Text
                    className="text-sm font-medium text-blue-600"
                    numberOfLines={1}
                  >
                    {jurisdiction.email}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* Website */}
            {jurisdiction.websiteUrl && (
              <TouchableOpacity
                className="flex-row items-center py-2.5 border-b border-neutral-100"
                onPress={() => handleOpenUrl(jurisdiction.websiteUrl!, "website")}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 bg-indigo-50 rounded-full items-center justify-center mr-3">
                  <Ionicons name="globe" size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500">Website</Text>
                  <Text
                    className="text-sm font-medium text-blue-600"
                    numberOfLines={1}
                  >
                    {jurisdiction.websiteUrl}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* Permit Portal */}
            {jurisdiction.permitPortalUrl && (
              <TouchableOpacity
                className="flex-row items-center py-2.5"
                onPress={() => handleOpenUrl(jurisdiction.permitPortalUrl!, "permit portal")}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 bg-amber-50 rounded-full items-center justify-center mr-3">
                  <Ionicons name="document-text" size={18} color="#D97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500">Permit Portal</Text>
                  <Text
                    className="text-sm font-medium text-blue-600"
                    numberOfLines={1}
                  >
                    {jurisdiction.permitPortalUrl}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Office Hours */}
        {hasOfficeHours && (
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
            <View className="flex-row items-center mb-3">
              <Ionicons name="time-outline" size={18} color="#374151" />
              <Text className="text-sm font-bold text-neutral-900 ml-2">
                Office Hours
              </Text>
            </View>

            {DAY_KEYS.map((dayKey, index) => {
              const hours = jurisdiction.officeHours?.[dayKey] ||
                jurisdiction.officeHours?.[DAY_LABELS[index]] ||
                jurisdiction.officeHours?.[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];

              return (
                <View
                  key={dayKey}
                  className={`flex-row items-center justify-between py-2 ${
                    index < DAY_KEYS.length - 1
                      ? "border-b border-neutral-100"
                      : ""
                  }`}
                >
                  <Text className="text-sm text-neutral-700 w-24">
                    {DAY_LABELS[index]}
                  </Text>
                  <Text
                    className={`text-sm ${
                      hours && hours.toLowerCase() !== "closed"
                        ? "text-neutral-900 font-medium"
                        : "text-neutral-400"
                    }`}
                  >
                    {hours || "Closed"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Address */}
        {jurisdiction.address && (
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
              <Ionicons name="map-outline" size={18} color="#374151" />
              <Text className="text-sm font-bold text-neutral-900 ml-2">
                Address
              </Text>
            </View>
            <Text className="text-sm text-neutral-700 leading-5">
              {jurisdiction.address}
            </Text>
          </View>
        )}

        {/* Notes */}
        {jurisdiction.notes && (
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
              <Ionicons name="information-circle-outline" size={18} color="#374151" />
              <Text className="text-sm font-bold text-neutral-900 ml-2">
                Notes
              </Text>
            </View>
            <Text className="text-sm text-neutral-700 leading-5">
              {jurisdiction.notes}
            </Text>
          </View>
        )}

        {/* Children Jurisdictions */}
        {jurisdiction.children && jurisdiction.children.length > 0 && (
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
            <View className="flex-row items-center mb-3">
              <Ionicons name="git-network-outline" size={18} color="#374151" />
              <Text className="text-sm font-bold text-neutral-900 ml-2">
                Sub-Jurisdictions ({jurisdiction.children.length})
              </Text>
            </View>

            {jurisdiction.children.map((child, index) => {
              const childTypeStyle = getTypeStyle(child.type);

              return (
                <TouchableOpacity
                  key={child.id}
                  className={`flex-row items-center py-3 ${
                    index < jurisdiction.children.length - 1
                      ? "border-b border-neutral-100"
                      : ""
                  }`}
                  onPress={() => router.push(`/jurisdictions/${child.id}`)}
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-sm font-medium text-neutral-900 mr-2">
                        {child.name}
                      </Text>
                      {child.isVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#10B981"
                        />
                      )}
                    </View>
                    <View className="flex-row items-center mt-1">
                      <View
                        className={`${childTypeStyle.bg} rounded-full px-2 py-0.5 mr-2`}
                      >
                        <Text
                          className={`text-xs font-medium ${childTypeStyle.text}`}
                        >
                          {TYPE_LABELS[child.type] || child.type}
                        </Text>
                      </View>
                      <Text className="text-xs text-neutral-500">
                        {child.state}
                        {child.county ? ` - ${child.county}` : ""}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Stats */}
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
          <Text className="text-sm font-bold text-neutral-900 mb-3">
            Statistics
          </Text>
          <View className="flex-row">
            <View className="flex-1 items-center py-2 bg-neutral-50 rounded-xl mr-2">
              <Text className="text-xl font-bold text-blue-600">
                {jurisdiction._count.properties}
              </Text>
              <Text className="text-xs text-neutral-500 mt-1">Properties</Text>
            </View>
            <View className="flex-1 items-center py-2 bg-neutral-50 rounded-xl ml-2">
              <Text className="text-xl font-bold text-blue-600">
                {jurisdiction._count.permits}
              </Text>
              <Text className="text-xs text-neutral-500 mt-1">Permits</Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
