import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

interface GoalCardProps {
  title: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  backgroundColor?: string;
}

export default function GoalCard({
  title,
  icon,
  selected,
  onPress,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
}: GoalCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor },
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {icon}
        <Text style={[
          styles.title,
          selected && styles.titleSelected,
        ]}>
          {title}
        </Text>
      </View>
      {selected && (
        <View style={styles.checkmark}>
          <Check size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    width: '48%',
    aspectRatio: 1,
    marginBottom: 12,
  },
  cardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  titleSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#03045e',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 