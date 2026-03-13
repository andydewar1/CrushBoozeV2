import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

interface SelectionButtonProps {
  title: string;
  selected: boolean;
  onPress: () => void;
}

export default function SelectionButton({
  title,
  selected,
  onPress,
}: SelectionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        selected && styles.buttonSelected,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.title,
        selected && styles.titleSelected,
      ]}>
        {title}
      </Text>
      {selected && (
        <View style={styles.checkContainer}>
          <Check size={20} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F2F2F7',
    borderRadius: 100,
    paddingVertical: 16,
    paddingLeft: 24,
    paddingRight: 48,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonSelected: {
    backgroundColor: '#03045e',
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  titleSelected: {
    color: '#FFFFFF',
  },
  checkContainer: {
    position: 'absolute',
    right: 16,
  },
}); 