import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormField } from "./FormField";

interface FormFieldDef {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helpText?: string;
  conditionalOn?: { field: string; value: unknown };
  defaultValue?: unknown;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldDef[];
}

interface FormSchema {
  sections: FormSection[];
}

interface FormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, unknown>;
  onSaveDraft: (data: Record<string, unknown>) => Promise<void>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  readOnly?: boolean;
}

export function FormRenderer({
  schema,
  initialData = {},
  onSaveDraft,
  onSubmit,
  readOnly = false,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [activeSection, setActiveSection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (id: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validateSection = (sectionIndex: number): boolean => {
    const section = schema.sections[sectionIndex];
    const newErrors: Record<string, string> = {};

    for (const field of section.fields) {
      if (field.conditionalOn) {
        const depValue = formData[field.conditionalOn.field];
        if (depValue !== field.conditionalOn.value) continue;
      }

      if (field.required) {
        const val = formData[field.id];
        if (val === undefined || val === null || val === "" || val === false) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = (): boolean => {
    const allErrors: Record<string, string> = {};

    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.conditionalOn) {
          const depValue = formData[field.conditionalOn.field];
          if (depValue !== field.conditionalOn.value) continue;
        }

        if (field.required) {
          const val = formData[field.id];
          if (val === undefined || val === null || val === "" || val === false) {
            allErrors[field.id] = `${field.label} is required`;
          }
        }
      }
    }

    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(activeSection)) {
      setActiveSection((prev) => Math.min(prev + 1, schema.sections.length - 1));
    }
  };

  const handlePrev = () => {
    setActiveSection((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSaveDraft(formData);
      Alert.alert("Saved", "Draft saved successfully.");
    } catch {
      Alert.alert("Error", "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      // Find first section with errors
      for (let i = 0; i < schema.sections.length; i++) {
        for (const field of schema.sections[i].fields) {
          if (errors[field.id]) {
            setActiveSection(i);
            Alert.alert("Validation Error", "Please fill in all required fields.");
            return;
          }
        }
      }
      return;
    }

    Alert.alert("Submit Form", "Are you sure you want to submit this form?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: async () => {
          setSubmitting(true);
          try {
            await onSubmit(formData);
          } catch {
            Alert.alert("Error", "Failed to submit form.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const currentSection = schema.sections[activeSection];
  const isLastSection = activeSection === schema.sections.length - 1;
  const isFirstSection = activeSection === 0;

  return (
    <View className="flex-1">
      {/* Section Progress */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 px-4">
        <View className="flex-row gap-2">
          {schema.sections.map((section, i) => (
            <TouchableOpacity
              key={section.id}
              onPress={() => setActiveSection(i)}
              className={`flex-row items-center rounded-full px-3 py-1.5 ${
                i === activeSection
                  ? "bg-blue-600"
                  : i < activeSection
                    ? "bg-blue-100"
                    : "bg-gray-100"
              }`}
            >
              <View
                className={`h-5 w-5 rounded-full items-center justify-center mr-1.5 ${
                  i === activeSection ? "bg-white/20" : "bg-white/50"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    i === activeSection ? "text-white" : i < activeSection ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {i < activeSection ? "✓" : i + 1}
                </Text>
              </View>
              <Text
                className={`text-xs font-medium ${
                  i === activeSection ? "text-white" : i < activeSection ? "text-blue-700" : "text-gray-500"
                }`}
                numberOfLines={1}
              >
                {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Current Section */}
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        <View
          className="bg-white rounded-2xl p-4 mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {currentSection.title}
          </Text>
          {currentSection.description && (
            <Text className="text-sm text-gray-500 mb-4">{currentSection.description}</Text>
          )}

          {currentSection.fields.map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={handleFieldChange}
              allValues={formData}
              error={errors[field.id]}
            />
          ))}
        </View>

        {/* Extra bottom padding for keyboard */}
        <View className="h-24" />
      </ScrollView>

      {/* Navigation Footer */}
      {!readOnly && (
        <View className="border-t border-gray-200 bg-white px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View>
              {!isFirstSection && (
                <TouchableOpacity
                  onPress={handlePrev}
                  className="flex-row items-center"
                >
                  <Ionicons name="chevron-back" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-1">Previous</Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleSaveDraft}
                disabled={saving}
                className="border border-gray-300 rounded-xl px-4 py-2.5"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#6B7280" />
                ) : (
                  <Text className="text-sm font-medium text-gray-600">Save Draft</Text>
                )}
              </TouchableOpacity>
              {isLastSection ? (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  className="bg-blue-600 rounded-xl px-4 py-2.5"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text className="text-sm font-medium text-white">Submit</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleNext}
                  className="bg-blue-600 rounded-xl px-4 py-2.5 flex-row items-center"
                >
                  <Text className="text-sm font-medium text-white mr-1">Next</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
