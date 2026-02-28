import React from 'react';
import { Pressable, View, type PressableProps } from "react-native";
import { Text } from "./Text";

type ButtonVariant = 'primary' | 'outlined' | 'secondary' | 'ghost' | 'soft';
type ButtonSize = 'lg' | 'md' | 'sm';

export type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  children: React.ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary active:bg-primary-pressed disabled:bg-primary-disabled-bg disabled:opacity-100',
  outlined:
    'bg-surface border-2 border-primary active:bg-primary/10 disabled:border-ink/20 disabled:bg-surface',
  secondary:
    'bg-white border-2 border-ink-light active:bg-ink/5 disabled:border-ink/20 disabled:opacity-60',
  ghost:
    'active:bg-primary/10 disabled:opacity-50',
  soft:
    'bg-primary/10 active:bg-primary/20 disabled:bg-primary/5 disabled:opacity-60',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white disabled:text-ink/20',
  outlined: 'text-primary disabled:text-ink/20',
  secondary: 'text-ink-light disabled:text-ink/20',
  ghost: 'text-primary disabled:text-ink/20',
  soft: 'text-primary disabled:text-ink/40',
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'h-btn-lg min-h-btn-lg rounded-btn px-btn-x-lg py-btn-y-lg',
  md: 'h-btn min-h-btn rounded-btn px-btn-x py-btn-y',
  sm: 'h-btn-sm min-h-btn-sm rounded-btn-sm px-btn-x-sm py-btn-y-sm',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  lg: 'text-btn-lg',
  md: 'text-btn',
  sm: 'text-btn-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'items-center justify-center';
  const variantClass = variantClasses[variant];
  const variantTextClass = variantTextClasses[variant];
  const sizeClass = sizeClasses[size];
  const sizeTextClass = sizeTextClasses[size];

  const isStringChild = typeof children === 'string';

  return (
    <Pressable
      className={`flex-row ${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {isStringChild ? (
        <Text
          className={`font-bold ${variantTextClass} ${sizeTextClass}`}
          numberOfLines={1}
        >
          {children}
        </Text>
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {children}
        </View>
      )}
    </Pressable>
  );
}
