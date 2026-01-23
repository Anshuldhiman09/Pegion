import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import MenuOptions from './MenuOptions';

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  menuType?: 'chat' | 'profile';
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = SCREEN_WIDTH * 0.7;

const MenuModal: React.FC<Props> = ({
  visible,
  onClose,
  navigation,
  menuType = 'chat',
}) => {
  const translateX = useRef(new Animated.Value(MENU_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : MENU_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Sliding Menu */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX }] },
        ]}
      >
        <MenuOptions
          navigation={navigation}
          onClose={onClose}
          menuType={menuType}
        />
      </Animated.View>
    </Modal>
  );
};

export default MenuModal;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    elevation: 10,
  },
});
