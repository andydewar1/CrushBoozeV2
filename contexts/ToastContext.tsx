import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react-native';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastContextType {
  showSuccess: (title: string, message?: string, action?: ToastAction) => void;
  showError: (title: string, message?: string, action?: ToastAction) => void;
  showInfo: (title: string, message?: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType>({
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
});

export const useToast = () => useContext(ToastContext);

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  action?: ToastAction;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      });
    }, 3000);
  }, [fadeAnim]);

  const showSuccess = useCallback((title: string, message?: string, action?: ToastAction) => {
    addToast({ type: 'success', title, message, action });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, action?: ToastAction) => {
    addToast({ type: 'error', title, message, action });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, action?: ToastAction) => {
    addToast({ type: 'info', title, message, action });
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      {toasts.map(toast => (
        <Animated.View
          key={toast.id}
          style={[
            styles.toast,
            { opacity: fadeAnim },
            toast.type === 'error' && styles.errorToast,
            toast.type === 'success' && styles.successToast,
            toast.type === 'info' && styles.infoToast,
          ]}
        >
          <View style={styles.toastContent}>
            <View style={styles.toastIcon}>
              {toast.type === 'success' && <CheckCircle size={24} color="#35998d" />}
              {toast.type === 'error' && <AlertCircle size={24} color="#FF3B30" />}
              {toast.type === 'info' && <Info size={24} color="#007AFF" />}
            </View>
            <View style={styles.toastText}>
              <Text style={styles.toastTitle}>{toast.title}</Text>
              {toast.message && (
                <Text style={styles.toastMessage}>{toast.message}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => removeToast(toast.id)}
              style={styles.closeButton}
            >
              <X size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          {toast.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                toast.action?.onPress();
                removeToast(toast.id);
              }}
            >
              <Text style={styles.actionText}>{toast.action.label}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      ))}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#35998d',
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  closeButton: {
    padding: 4,
  },
  actionButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#35998d',
    textAlign: 'center',
  },
}); 