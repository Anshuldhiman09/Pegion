import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MenuModal from '../screens/menu/MenuModal';

interface Props {
  title: string;
  navigation?: any;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  onSearch?: () => void;

  showEdit?: boolean;
  onEditPress?: () => void;
  menuType?: 'chat' | 'profile';
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

  return (
    <>
      <StatusBar backgroundColor="#0B1C26" barStyle="light-content" />

      <View style={styles.container}>
        {/* LEFT */}
        <View style={styles.left}>
          {showBack && navigation ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
        </View>

        {/* RIGHT */}
        <View style={styles.right}>
          {showEdit && onEditPress && (
            <TouchableOpacity onPress={onEditPress}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}

          {showSearch && onSearch && (
            <TouchableOpacity onPress={onSearch}>
              <Text style={styles.actionSearch}>Search</Text>
            </TouchableOpacity>
          )}

          {showMenu && navigation && (
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Text style={styles.actionText}>⋮</Text>
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
    height: 60,
    backgroundColor: '#799e9e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  backText: { fontSize: 16, color: '#fff' },

  editText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },

  actionSearch: { fontSize: 16, color: '#fff' },
  actionText: { fontSize: 28, color: '#fff' },
});
