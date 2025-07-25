import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  action,
  onDismiss,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const offset = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(offset, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(offset, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  const getIcon = () => {
    const props = { size: 24, strokeWidth: 2 };
    switch (type) {
      case 'success':
        return <CheckCircle2 {...props} color="#10B981" />;
      case 'error':
        return <XCircle {...props} color="#EF4444" />;
      case 'warning':
        return <AlertCircle {...props} color="#F59E0B" />;
      case 'info':
        return <Info {...props} color="#3B82F6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)';
      case 'info':
        return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.2)';
      case 'error':
        return 'rgba(239, 68, 68, 0.2)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.2)';
      case 'info':
        return 'rgba(59, 130, 246, 0.2)';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY: offset }],
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.icon}>{getIcon()}</View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>

      {action && (
        <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  actionButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default Toast; 