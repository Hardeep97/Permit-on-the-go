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
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "Login failed. Please check your credentials.";
      Alert.alert("Login Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Google Sign-In",
      "Google Sign-In requires additional Expo configuration. Please set up expo-auth-session with your Google OAuth credentials.",
      [{ text: "OK" }]
    );
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
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-brand-600 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="document-text" size={40} color="#FFFFFF" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">
              Permits on the Go
            </Text>
            <Text className="text-base text-gray-500 mt-2">
              Manage permits from anywhere
            </Text>
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center py-3.5 rounded-xl border border-gray-300 bg-white mb-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
            onPress={handleGoogleSignIn}
            activeOpacity={0.7}
          >
            {/* Google "G" logo text in brand colors */}
            <View className="w-5 h-5 items-center justify-center mr-3">
              <Text
                className="text-lg font-bold"
                style={{ color: "#4285F4" }}
              >
                G
              </Text>
            </View>
            <Text className="text-base font-medium text-gray-700">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Separator */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-sm text-gray-400">
              or sign in with email
            </Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Email */}
            <View>
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
                  placeholder="Enter your password"
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

            {/* Forgot Password */}
            <TouchableOpacity className="self-end mt-2">
              <Text className="text-sm text-brand-600 font-medium">
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              className={`mt-6 py-4 rounded-xl items-center ${
                isLoading || !email || !password
                  ? "bg-brand-300"
                  : "bg-brand-600"
              }`}
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Log In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-sm text-gray-500">
              Don't have an account?{" "}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-sm text-brand-600 font-semibold">
                  Register
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
