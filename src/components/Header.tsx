import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MenuModal from '../screens/menu/MenuModal';
import { useTheme, getNeumorphicStyles } from '../theme';
import FocusAwareStatusBar from './FocusAwareStatusBar';

interface Props {
  title: string;
  navigation?: any;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  onSearch?: () => void;
  showEdit?: boolean;
  onEditPress?: () => void;
  menuType?: 'chat' | 'profile' | 'status';
}

const Header: React.FC<Props> = ({
  title,
  navigation,
  showBack = false,
  showMenu = false,
  showSearch = false,
  onSearch,
  showEdit = false,
  onEditPress,
  menuType = 'chat',
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  return (
    <>
      <FocusAwareStatusBar
        backgroundColor={colors.statusBg}
        barStyle={colors.statusBar}
        translucent={false}
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.left}>
          {showBack && navigation && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, neu.circleButton(38, { depth: 'low' })]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          )}

          {showMenu && navigation && (
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={[styles.menuBtn, neu.circleButton(38, { depth: 'low' })]}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={20} color={colors.text} />
            </TouchableOpacity>
          )}

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        <View style={styles.right}>
          {showEdit && onEditPress && (
            <TouchableOpacity
              onPress={onEditPress}
              style={[styles.actionBtn, neu.circleButton(38, { depth: 'low' })]}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
          {showSearch && onSearch && (
            <TouchableOpacity
              onPress={onSearch}
              style={[styles.actionBtn, neu.circleButton(38, { depth: 'low' })]}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showMenu && navigation && (
        <MenuModal
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          navigation={navigation}
          menuType={menuType}
        />
      )}
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  backBtn: { marginRight: 2 },
  menuBtn: { marginRight: 2 },
  actionBtn: {},
});

