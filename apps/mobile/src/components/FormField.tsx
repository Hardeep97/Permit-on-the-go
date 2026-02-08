import { View, Text, TextInput, TouchableOpacity, Platform, Switch } from "react-native";

interface FormFieldOption {
  field: string;
  value: unknown;
}

interface FormFieldDef {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helpText?: string;
  conditionalOn?: FormFieldOption;
  defaultValue?: unknown;
}

interface FormFieldProps {
  field: FormFieldDef;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
  allValues: Record<string, unknown>;
  error?: string;
}

export function FormField({ field, value, onChange, allValues, error }: FormFieldProps) {
  // Check conditional visibility
  if (field.conditionalOn) {
    const depValue = allValues[field.conditionalOn.field];
    if (depValue !== field.conditionalOn.value) return null;
  }

  const inputClass = "bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900";
  const errorBorder = error ? "border-red-300" : "border-gray-200";

  const renderField = () => {
    switch (field.type) {
      case "TEXT":
      case "ADDRESS":
        return (
          <TextInput
            className={`${inputClass} ${errorBorder}`}
            value={(value as string) || ""}
            onChangeText={(v) => onChange(field.id, v)}
            placeholder={field.placeholder || field.label}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
        );

      case "EMAIL":
        return (
          <TextInput
            className={`${inputClass} ${errorBorder}`}
            value={(value as string) || ""}
            onChangeText={(v) => onChange(field.id, v)}
            placeholder={field.placeholder || "email@example.com"}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        );

      case "PHONE":
        return (
          <TextInput
            className={`${inputClass} ${errorBorder}`}
            value={(value as string) || ""}
            onChangeText={(v) => onChange(field.id, v)}
            placeholder={field.placeholder || "(555) 555-5555"}
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        );

      case "NUMBER":
        return (
          <TextInput
            className={`${inputClass} ${errorBorder}`}
            value={value !== undefined && value !== null ? String(value) : ""}
            onChangeText={(v) => onChange(field.id, v ? Number(v) : "")}
            placeholder={field.placeholder || "0"}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
          />
        );

      case "DATE":
        return (
          <TextInput
            className={`${inputClass} ${errorBorder}`}
            value={(value as string) || ""}
            onChangeText={(v) => onChange(field.id, v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />
        );

      case "TEXTAREA":
        return (
          <TextInput
            className={`${inputClass} ${errorBorder} h-24`}
            value={(value as string) || ""}
            onChangeText={(v) => onChange(field.id, v)}
            placeholder={field.placeholder || ""}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );

      case "SELECT":
        return (
          <View className="flex-row flex-wrap gap-2">
            {field.options?.map((opt) => (
              <TouchableOpacity
                key={opt}
                className={`rounded-full px-3 py-1.5 border ${
                  value === opt ? "border-blue-500 bg-blue-50" : "border-transparent bg-gray-100"
                }`}
                onPress={() => onChange(field.id, opt)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    value === opt ? "text-blue-700" : "text-gray-600"
                  }`}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "MULTI_SELECT":
        const selected = Array.isArray(value) ? (value as string[]) : [];
        return (
          <View className="flex-row flex-wrap gap-2">
            {field.options?.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  className={`rounded-full px-3 py-1.5 border ${
                    isChecked ? "border-blue-500 bg-blue-50" : "border-transparent bg-gray-100"
                  }`}
                  onPress={() => {
                    const newVal = isChecked
                      ? selected.filter((v) => v !== opt)
                      : [...selected, opt];
                    onChange(field.id, newVal);
                  }}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isChecked ? "text-blue-700" : "text-gray-600"
                    }`}
                  >
                    {isChecked ? "✓ " : ""}{opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case "CHECKBOX":
        return (
          <View className="flex-row items-center">
            <Switch
              value={!!value}
              onValueChange={(v) => onChange(field.id, v)}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={value ? "#2563EB" : "#F3F4F6"}
              ios_backgroundColor="#D1D5DB"
            />
            <Text className="ml-3 text-sm text-gray-700">{field.label}</Text>
          </View>
        );

      case "RADIO":
        return (
          <View className="gap-2">
            {field.options?.map((opt) => (
              <TouchableOpacity
                key={opt}
                className="flex-row items-center gap-2"
                onPress={() => onChange(field.id, opt)}
              >
                <View
                  className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                    value === opt ? "border-blue-600" : "border-gray-300"
                  }`}
                >
                  {value === opt && <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                </View>
                <Text className="text-sm text-gray-700">{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "SIGNATURE":
        return (
          <View>
            <TextInput
              className={`${inputClass} ${errorBorder} italic`}
              value={(value as string) || ""}
              onChangeText={(v) => onChange(field.id, v)}
              placeholder="Type your full name as signature"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
            <Text className="mt-1 text-xs text-gray-400">
              By typing your name, you agree this serves as your electronic signature.
            </Text>
          </View>
        );

      default:
        return (
          <TextInput
            className={`${inputClass} ${errorBorder}`}
            value={(value as string) || ""}
            onChangeText={(v) => onChange(field.id, v)}
            placeholder={field.placeholder || ""}
            placeholderTextColor="#9CA3AF"
          />
        );
    }
  };

  return (
    <View className="mb-4">
      {field.type !== "CHECKBOX" && (
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          {field.label}
          {field.required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}
      {renderField()}
      {field.helpText && (
        <Text className="mt-1 text-xs text-gray-400">{field.helpText}</Text>
      )}
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
