import { View, TextInput, type TextInputProps } from "react-native";
import { Text } from "./Text";
import { useState } from 'react';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  disabled?: boolean;
  containerClassName?: string;
};

export function Input({
  label,
  error,
  disabled = false,
  containerClassName = '',
  className = '',
  placeholderTextColor,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClass = error
    ? 'border-primary'
    : isFocused
      ? 'border-primary'
      : 'border-ink/5';
  const bgClass = disabled ? 'bg-primary-disabled-bg' : 'bg-background';

  return (
    <View className={containerClassName}>
      {label ? (
        <Text
          className={`text-overline font-bold text-ink/40 mb-1.5 ${
            isFocused ? 'text-primary' : ''
          }`}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        className={`rounded-input border-2 ${borderClass} ${bgClass} px-space-card h-12 text-body text-ink placeholder:text-ink/30 ${className}`}
        placeholderTextColor={placeholderTextColor ?? undefined}
        editable={!disabled}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <Text className="text-caption text-primary mt-1.5">{error}</Text>
      ) : null}
    </View>
  );
}
