import React, { useContext } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useTheme, getNeumorphicStyles } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LogoutConfirm: React.FC<Props> = ({ visible, onClose }) => {
  const { logout } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.box,
            neu.cardElevated({ radius: 24, depth: 'high' }),
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Logout</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Are you sure you want to logout?
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.btn,
                neu.circleButton(42, { depth: 'low' }),
                { width: 'auto', paddingHorizontal: 20, borderRadius: 21, backgroundColor: colors.surfaceSubtle },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancel, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                neu.circleButton(42, { depth: 'high' }),
                { width: 'auto', paddingHorizontal: 20, borderRadius: 21, backgroundColor: colors.danger },
              ]}
              onPress={handleLogout}
            >
              <Text style={styles.confirm}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutConfirm;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  box: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirm: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
});

