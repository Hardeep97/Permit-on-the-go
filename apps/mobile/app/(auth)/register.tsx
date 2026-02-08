import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid =
    fullName && email && password && confirmPassword && password === confirmPassword;

  const handleRegister = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      // TODO: Integrate with auth store and API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Branding */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-brand-600 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="document-text" size={40} color="#FFFFFF" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">
              Create Account
            </Text>
            <Text className="text-base text-gray-500 mt-2">
              Get started with Permits on the Go
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Full Name */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-base text-gray-900"
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Email
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-base text-gray-900"
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Password
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-base text-gray-900"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-base text-gray-900"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
              {confirmPassword && password !== confirmPassword && (
                <Text className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className={`mt-6 py-4 rounded-xl items-center ${
                isLoading || !isFormValid ? "bg-brand-300" : "bg-brand-600"
              }`}
              onPress={handleRegister}
              disabled={isLoading || !isFormValid}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-sm text-gray-500">
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-sm text-brand-600 font-semibold">
                  Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
