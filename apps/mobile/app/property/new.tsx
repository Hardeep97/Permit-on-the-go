import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed Use",
  INDUSTRIAL: "Industrial",
};

export default function NewPropertyScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [blockLot, setBlockLot] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [units, setUnits] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const selectedStateName = US_STATES.find((s) => s.code === state)?.name;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter a property name.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Validation", "Please enter an address.");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Validation", "Please enter a city.");
      return;
    }
    if (!state) {
      Alert.alert("Validation", "Please select a state.");
      return;
    }
    if (!zipCode.trim()) {
      Alert.alert("Validation", "Please enter a zip code.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state,
        zipCode: zipCode.trim(),
      };
      if (county.trim()) payload.county = county.trim();
      if (propertyType) payload.propertyType = propertyType;
      if (blockLot.trim()) payload.blockLot = blockLot.trim();
      if (yearBuilt) payload.yearBuilt = parseInt(yearBuilt);
      if (squareFeet) payload.squareFeet = parseInt(squareFeet);
      if (units) payload.units = parseInt(units);

      const response = await api.post("/properties", payload);
      Alert.alert("Success", "Property added successfully!", [
        { text: "OK", onPress: () => router.replace(`/property/${response.data.id}`) },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to create property.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Add Property</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              Property Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="e.g. Sunrise Office Complex"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Address */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              Address <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="123 Main Street"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* City + County row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                City <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholder="City"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">County</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholder="County"
                placeholderTextColor="#9CA3AF"
                value={county}
                onChangeText={setCounty}
              />
            </View>
          </View>

          {/* State Picker */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              State <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowStatePicker(!showStatePicker)}
            >
              <Text className={`text-sm ${state ? "text-gray-900" : "text-gray-400"}`}>
                {selectedStateName || "Select state..."}
              </Text>
              <Ionicons
                name={showStatePicker ? "chevron-up" : "chevron-down"}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {showStatePicker && (
              <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden" style={{ maxHeight: 200 }}>
                <ScrollView nestedScrollEnabled>
                  {US_STATES.map((s) => (
                    <TouchableOpacity
                      key={s.code}
                      className={`px-4 py-2.5 border-b border-gray-50 ${
                        state === s.code ? "bg-brand-50" : ""
                      }`}
                      onPress={() => {
                        setState(s.code);
                        setShowStatePicker(false);
                      }}
                    >
                      <Text className="text-sm text-gray-900">
                        {s.name} ({s.code})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Zip Code */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              Zip Code <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="12345"
              placeholderTextColor="#9CA3AF"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Property Type Picker */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Property Type</Text>
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text className={`text-sm ${propertyType ? "text-gray-900" : "text-gray-400"}`}>
                {propertyType ? PROPERTY_TYPE_LABELS[propertyType] : "Select type..."}
              </Text>
              <Ionicons
                name={showTypePicker ? "chevron-up" : "chevron-down"}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {showTypePicker && (
              <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden">
                {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    className={`px-4 py-3 border-b border-gray-50 ${
                      propertyType === key ? "bg-brand-50" : ""
                    }`}
                    onPress={() => {
                      setPropertyType(key);
                      setShowTypePicker(false);
                    }}
                  >
                    <Text className="text-sm text-gray-900">{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Block/Lot */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Block / Lot</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="e.g. Block 123, Lot 45"
              placeholderTextColor="#9CA3AF"
              value={blockLot}
              onChangeText={setBlockLot}
            />
          </View>

          {/* Year Built + Square Feet row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Year Built</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholder="2020"
                placeholderTextColor="#9CA3AF"
                value={yearBuilt}
                onChangeText={setYearBuilt}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Square Feet</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholder="2500"
                placeholderTextColor="#9CA3AF"
                value={squareFeet}
                onChangeText={setSquareFeet}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Units */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">Units</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
              placeholder="Number of units (if multi-family)"
              placeholderTextColor="#9CA3AF"
              value={units}
              onChangeText={setUnits}
              keyboardType="numeric"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            className="bg-brand-600 rounded-xl py-4 items-center flex-row justify-center"
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            style={submitting ? { opacity: 0.6 } : undefined}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text className="text-white text-base font-bold">
              {submitting ? "Adding..." : "Add Property"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
