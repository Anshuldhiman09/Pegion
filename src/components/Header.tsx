import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
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

  return (
    <>
      <StatusBar backgroundColor="#0B1C26" barStyle="light-content" />

      <View style={styles.container}>
        <View style={styles.left}>
          {showBack && navigation ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
        </View>

        <View style={styles.right}>
          {showSearch && onSearch && (
            <TouchableOpacity onPress={onSearch}>
              <Image
                source={require('../assets/icons/search.png')}
                style={styles.searchIcon}
              />
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
    backgroundColor: '#7b7f85',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  title: { fontSize: 26, fontWeight: '700', color: '#f5f6f7' },
  backText: { fontSize: 16, color: '#fff' },

  searchIcon: { width: 22, height: 22 },
  actionText: { fontSize: 28, color: '#fff' },
});
