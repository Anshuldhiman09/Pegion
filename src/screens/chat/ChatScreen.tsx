import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Modal,
  Dimensions,
  Pressable,
  ScrollView,
  Alert,
  PanResponder,
  Animated,
  NativeModules,
  BackHandler,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmojiSelector from 'react-native-emoji-selector';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../../context/AuthContext';
import { uploadService } from '../../api';
import ChatSocketService, {
  ChatMessagePayload,
} from '../../services/ChatSocketService';
import { getChatHistory, markMessagesRead } from '../../services/ChatApiService';
import { useTheme, getNeumorphicStyles } from '../../theme';
import TypingIndicator from '../../components/TypingIndicator';
import ChatPatternOverlay from '../../components/ChatPatternOverlay';
import FocusAwareStatusBar from '../../components/FocusAwareStatusBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const defaultUser = require('../../assets/icons/user.png');

export const BUBBLE_THEMES = [
  { id: 'default', name: 'Coral Red', color: '#ff4438' },
  { id: 'indigo', name: 'Royal Indigo', color: '#6366f1' },
  { id: 'sky', name: 'Sky Blue', color: '#0284c7' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'purple', name: 'Neon Purple', color: '#8b5cf6' },
  { id: 'amber', name: 'Sunset Amber', color: '#f59e0b' },
  { id: 'rose', name: 'Rose Pink', color: '#f43f5e' },
  { id: 'teal', name: 'Cyan Teal', color: '#06b6d4' },
  { id: 'crimson', name: 'Crimson Wine', color: '#be123c' },
  { id: 'violet', name: 'Electric Violet', color: '#7c3aed' },
  { id: 'ocean', name: 'Oceanic Blue', color: '#2563eb' },
  { id: 'midnight', name: 'Pitch Dark', color: '#27272a' },
];

export interface WallpaperTheme {
  id: string;
  name: string;
  category: 'all' | 'dark' | 'neon' | 'nature' | 'pastel';
  light: string;
  dark: string;
}

export const WALLPAPER_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'dark', label: 'Dark / AMOLED' },
  { key: 'neon', label: 'Neon & Dusk' },
  { key: 'nature', label: 'Nature' },
  { key: 'pastel', label: 'Pastel' },
];

export const BG_THEMES: WallpaperTheme[] = [
  { id: 'default', name: 'Default', category: 'all', light: '#f4f6f9', dark: '#16181b' },
  { id: 'amoled', name: 'AMOLED Black', category: 'dark', light: '#ffffff', dark: '#000000' },
  { id: 'slate', name: 'Dark Slate', category: 'dark', light: '#f1f5f9', dark: '#0f172a' },
  { id: 'charcoal', name: 'Charcoal Minimal', category: 'dark', light: '#f3f4f6', dark: '#18181b' },
  { id: 'navy', name: 'Deep Space Navy', category: 'dark', light: '#eef6ff', dark: '#070d1e' },
  { id: 'nordic', name: 'Nordic Frost', category: 'dark', light: '#e2eafc', dark: '#0d1e2d' },
  { id: 'cyberpunk', name: 'Cyberpunk Dusk', category: 'neon', light: '#fdf2f8', dark: '#180829' },
  { id: 'sunset', name: 'Sunset Crimson', category: 'neon', light: '#fff1f2', dark: '#2d0b17' },
  { id: 'aurora', name: 'Aurora Teal', category: 'neon', light: '#ecfeff', dark: '#03232b' },
  { id: 'galaxy', name: 'Galaxy Violet', category: 'neon', light: '#f5f3ff', dark: '#1d0e36' },
  { id: 'forest', name: 'Emerald Forest', category: 'nature', light: '#f0fdf4', dark: '#052a1b' },
  { id: 'matcha', name: 'Soft Matcha', category: 'nature', light: '#f2fbf7', dark: '#092820' },
  { id: 'espresso', name: 'Espresso Coffee', category: 'nature', light: '#fbf4ec', dark: '#1e130c' },
  { id: 'dune', name: 'Sahara Gold', category: 'nature', light: '#fefce8', dark: '#241b0c' },
  { id: 'ocean', name: 'Deep Sea Blue', category: 'nature', light: '#e0f2fe', dark: '#021a36' },
  { id: 'sakura', name: 'Sakura Blossom', category: 'pastel', light: '#fff1f4', dark: '#2c0c18' },
  { id: 'lavender', name: 'Lavender Mist', category: 'pastel', light: '#faf5ff', dark: '#1a1645' },
  { id: 'vanilla', name: 'Warm Vanilla', category: 'pastel', light: '#fdf8f0', dark: '#231b17' },
  { id: 'peach', name: 'Peach Fizz', category: 'pastel', light: '#fff7ed', dark: '#2d130e' },
  { id: 'icemin', name: 'Ice Mint', category: 'pastel', light: '#ecfdf5', dark: '#082823' },
];

const isImageUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    (trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('file://') ||
      trimmed.startsWith('content://')) &&
    (trimmed.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) !== null ||
      trimmed.includes('cloudinary.com') ||
      trimmed.includes('/pegion_chat/') ||
      trimmed.includes('/image/upload/'))
  );
};

interface SwipeableMessageBubbleProps {
  children: React.ReactNode;
  onSwipeReply: () => void;
  bubbleColor: string;
}

const SwipeableMessageBubble: React.FC<SwipeableMessageBubbleProps> = ({
  children,
  onSwipeReply,
  bubbleColor,
}) => {
  const panX = useRef(new Animated.Value(0)).current;
  const replyTriggeredRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dx > 18 &&
          gestureState.dx > Math.abs(gestureState.dy) * 1.8
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        replyTriggeredRef.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          const clamped = Math.min(gestureState.dx, 56);
          panX.setValue(clamped);

          if (clamped >= 30 && !replyTriggeredRef.current) {
            replyTriggeredRef.current = true;
          }
        }
      },
      onPanResponderRelease: () => {
        if (replyTriggeredRef.current) {
          onSwipeReply();
        }
        Animated.spring(panX, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const iconScale = panX.interpolate({
    inputRange: [0, 18, 38],
    outputRange: [0.4, 0.75, 1.2],
    extrapolate: 'clamp',
  });

  const iconOpacity = panX.interpolate({
    inputRange: [0, 12, 35],
    outputRange: [0, 0.6, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.swipeableContainer} {...panResponder.panHandlers}>
      {/* Animated curved reply arrow behind bubble */}
      <Animated.View
        style={[
          styles.replyIconBehind,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <Ionicons name="arrow-undo" size={20} color={bubbleColor} />
      </Animated.View>

      {/* Sliding message bubble */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX: panX }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const recipient = route.params?.recipient;
  const otherUserId =
    route.params?.otherUserId ??
    recipient?.id ??
    recipient?.userId;
  const otherUserName =
    route.params?.otherUserName ??
    recipient?.name ??
    recipient?.username ??
    'Chat';
  const otherUserProfileImage =
    recipient?.profileImageUrl ?? recipient?.photo;

  const otherUserEmail =
    route.params?.email ??
    recipient?.email;
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('BottomTabs');
    }
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleBack]);

  const [currentUserId, setCurrentUserId] = useState<string | number | null>(
    user?.id ?? null,
  );
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessagePayload | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Custom theme customization state
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [wallpaperTab, setWallpaperTab] = useState<string>('all');
  const [customBgColor, setCustomBgColor] = useState<string | null>(null);
  const [customBubbleColor, setCustomBubbleColor] = useState<string | null>(null);
  const [customPattern, setCustomPattern] = useState<boolean>(false);
  const [tempBgColor, setTempBgColor] = useState<string | null>(null);
  const [tempBubbleColor, setTempBubbleColor] = useState<string | null>(null);
  const [tempPattern, setTempPattern] = useState<boolean>(false);

  // Media preview and options states
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type?: string;
    fileName?: string;
    isVideo?: boolean;
  } | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Multi-message selection & pinned message states
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string | number>>(new Set());
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessagePayload | null>(null);

  const isSelectionMode = selectedMessageIds.size > 0;

  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Toggle selection on tap
  const toggleSelectMessage = useCallback((msg: ChatMessagePayload) => {
    const msgId = msg.id;
    if (msgId === undefined || msgId === null) return;
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  }, []);

  // Long-press enters selection mode and selects the message
  const handleMessageLongPress = useCallback((msg: ChatMessagePayload) => {
    const msgId = msg.id;
    if (msgId === undefined || msgId === null) return;
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      next.add(msgId);
      return next;
    });
  }, []);

  // Regular tap toggles selection when already in selection mode
  const handleMessagePress = useCallback((msg: ChatMessagePayload) => {
    if (selectedMessageIds.size > 0) {
      toggleSelectMessage(msg);
    }
  }, [selectedMessageIds.size, toggleSelectMessage]);

  const clearSelection = useCallback(() => {
    setSelectedMessageIds(new Set());
  }, []);

  const getSelectedMessagesList = useCallback(() => {
    return messages.filter(
      m => m.id !== undefined && m.id !== null && selectedMessageIds.has(m.id),
    );
  }, [messages, selectedMessageIds]);

  // Copy selected messages to clipboard
  const handleCopySelected = useCallback(() => {
    const sel = getSelectedMessagesList();
    if (sel.length === 0) return;
    const textToCopy = sel.map(m => m.content).join('\n');
    try {
      if (NativeModules.Clipboard?.setString) {
        NativeModules.Clipboard.setString(textToCopy);
      } else if (NativeModules.RNCClipboard?.setString) {
        NativeModules.RNCClipboard.setString(textToCopy);
      }
    } catch (e) {
      console.log('Clipboard copy notice:', e);
    }
    Toast.show({
      type: 'info',
      text1: sel.length === 1 ? 'Message Copied' : `${sel.length} Messages Copied`,
      text2: 'Copied to clipboard',
    });
    clearSelection();
  }, [getSelectedMessagesList, clearSelection]);

  // Delete selected messages locally
  const handleDeleteSelected = useCallback(() => {
    const sel = getSelectedMessagesList();
    if (sel.length === 0) return;

    Alert.alert(
      sel.length === 1 ? 'Delete Message' : `Delete ${sel.length} Messages`,
      'Are you sure you want to delete the selected message(s)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for me',
          style: 'destructive',
          onPress: () => {
            const idsToDelete = new Set(sel.map(m => m.id));
            setMessages(prev => prev.filter(m => !idsToDelete.has(m.id)));
            Toast.show({
              type: 'info',
              text1: 'Message Deleted',
              text2: `${sel.length} message(s) removed`,
            });
            clearSelection();
          },
        },
      ],
    );
  }, [getSelectedMessagesList, clearSelection]);

  // Pin/unpin selected single message
  const handlePinSelected = useCallback(() => {
    const sel = getSelectedMessagesList();
    if (sel.length !== 1) return;
    const msgToPin = sel[0];
    if (pinnedMessage?.id === msgToPin.id) {
      setPinnedMessage(null);
      Toast.show({
        type: 'info',
        text1: 'Message Unpinned',
      });
    } else {
      setPinnedMessage(msgToPin);
      Toast.show({
        type: 'success',
        text1: 'Message Pinned',
        text2: 'Pinned at top of conversation',
      });
    }
    clearSelection();
  }, [getSelectedMessagesList, pinnedMessage, clearSelection]);

  // Quick reply to selected single message from top bar
  const handleReplySelected = useCallback(() => {
    const sel = getSelectedMessagesList();
    if (sel.length !== 1) return;
    const msg = sel[0];
    setReplyingTo(msg);
    setShowEmoji(false);
    clearSelection();
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, [getSelectedMessagesList, clearSelection]);

  // Forward selected messages
  const handleForwardSelected = useCallback(() => {
    const sel = getSelectedMessagesList();
    if (sel.length === 0) return;
    const forwardText = sel.map(m => m.content).join('\n');
    clearSelection();
    navigation.navigate('ConnectedUsers', {
      forwardText,
    });
    Toast.show({
      type: 'info',
      text1: 'Forward Message',
      text2: 'Select a conversation to forward',
    });
  }, [getSelectedMessagesList, clearSelection, navigation]);

  // Auto-scroll to latest message when keyboard opens (WhatsApp style)
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );
    return () => {
      showSub.remove();
    };
  }, []);

  // Load saved theme customization
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const key = otherUserId ? `@chat_theme_${otherUserId}` : '@chat_theme_default';
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.bg !== undefined) setCustomBgColor(parsed.bg);
          if (parsed.bubble !== undefined) setCustomBubbleColor(parsed.bubble);
          if (parsed.pattern !== undefined) setCustomPattern(parsed.pattern);
        }
      } catch (e) {
        console.log('Error loading custom chat theme:', e);
      }
    };
    loadSavedTheme();
  }, [otherUserId]);

  const handleSaveCustomTheme = async (bg: string | null, bubble: string | null, pattern: boolean) => {
    setCustomBgColor(bg);
    setCustomBubbleColor(bubble);
    setCustomPattern(pattern);
    try {
      const key = otherUserId ? `@chat_theme_${otherUserId}` : '@chat_theme_default';
      if (!bg && !bubble && !pattern) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, JSON.stringify({ bg, bubble, pattern }));
      }

      // Find selected theme name
      const selectedBg = BG_THEMES.find(
        t => (isDark ? t.dark === bg : t.light === bg) || (t.id === 'default' && bg === null),
      );
      const themeName = selectedBg?.name || 'Custom Theme';

      // Broadcast theme change to peer over WebSocket & chat channel
      if (otherUserId) {
        ChatSocketService.sendTheme(otherUserId, {
          bg,
          bubble,
          pattern,
          themeName,
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Theme Updated for Both',
        text2: `Theme applied and synced with ${otherUserName}`,
      });
    } catch (e) {
      console.log('Error saving custom chat theme:', e);
    }
  };

  // Synchronized refs to avoid stale closures in socket callbacks
  const currentUserIdRef = useRef<any>(currentUserId);
  const otherUserIdRef = useRef<any>(otherUserId);
  const otherUserEmailRef = useRef<any>(otherUserEmail);
  const otherUserNameRef = useRef<any>(otherUserName);
  const userEmailRef = useRef<any>(user?.email);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    otherUserIdRef.current = otherUserId;
    otherUserEmailRef.current = otherUserEmail;
    otherUserNameRef.current = otherUserName;
    userEmailRef.current = user?.email;
  }, [currentUserId, otherUserId, otherUserEmail, otherUserName, user]);

  // Handle incoming theme sync from peer
  const handleRemoteThemeUpdate = useCallback(
    (themeData: any) => {
      console.log('🎨 [ChatScreen] Remote theme sync received:', themeData);
      const bg = themeData.bg ?? null;
      const bubble = themeData.bubble ?? null;
      const pattern = Boolean(themeData.pattern);

      setCustomBgColor(bg);
      setCustomBubbleColor(bubble);
      setCustomPattern(pattern);

      if (otherUserIdRef.current) {
        const key = `@chat_theme_${otherUserIdRef.current}`;
        AsyncStorage.setItem(key, JSON.stringify({ bg, bubble, pattern }));
      }

      Toast.show({
        type: 'info',
        text1: 'Chat Theme Updated',
        text2: `${otherUserNameRef.current} changed the chat theme`,
      });
    },
    [],
  );

  // Mark chat as read via both REST API and Socket.IO
  const markChatAsRead = useCallback(() => {
    const targetId = otherUserIdRef.current;
    if (targetId) {
      markMessagesRead(targetId);
      ChatSocketService.sendRead(targetId);
    }
  }, []);

  // Hide bottom tabs when ChatScreen is focused & mark as read
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(colors.surface, true);
      }

      markChatAsRead();

      return () => {
        if (Platform.OS === 'android') {
          StatusBar.setTranslucent(false);
          StatusBar.setBackgroundColor(colors.statusBg, true);
        }
        parent?.setOptions({
          tabBarStyle: undefined,
        });
      };
    }, [navigation, markChatAsRead, colors.surface, colors.statusBg]),
  );

  // Incoming message handler from WebSocket
  const handleIncomingMessage = useCallback(
    (message: ChatMessagePayload) => {
      console.log('Incoming WebSocket message in ChatScreen:', message);

      const oId = String(otherUserIdRef.current ?? '').trim();
      const oEmail = String(otherUserEmailRef.current ?? '').trim().toLowerCase();
      const oName = String(otherUserNameRef.current ?? '').trim().toLowerCase();
      const cId = String(currentUserIdRef.current ?? '').trim();
      const cEmail = String(userEmailRef.current ?? '').trim().toLowerCase();

      const sender = String(message.senderId ?? '').trim();
      const senderLower = sender.toLowerCase();
      const receiver = String(message.receiverId ?? '').trim();
      const receiverLower = receiver.toLowerCase();

      const isFromOther =
        (oId.length > 0 && sender === oId) ||
        (oEmail.length > 0 && senderLower === oEmail) ||
        (oName.length > 0 && senderLower === oName);

      const isFromMe =
        (cId.length > 0 && sender === cId) ||
        (cEmail.length > 0 && senderLower === cEmail) ||
        senderLower === 'me';

      const isToOther =
        (oId.length > 0 && receiver === oId) ||
        (oEmail.length > 0 && receiverLower === oEmail) ||
        (oName.length > 0 && receiverLower === oName);

      const isToMe =
        (cId.length > 0 && receiver === cId) ||
        (cEmail.length > 0 && receiverLower === cEmail);

      // Only handle if message belongs to this conversation
      const isRelevant =
        isFromOther ||
        (isFromMe && isToOther) ||
        (isFromOther && isToMe) ||
        (isFromMe && !receiver);

      if (isRelevant) {
        setMessages(prev => {
          let nextMsgs: ChatMessagePayload[];
          if (
            message.id !== undefined &&
            message.id !== null &&
            prev.some(m => String(m.id) === String(message.id))
          ) {
            nextMsgs = prev.map(m =>
              String(m.id) === String(message.id) ? message : m,
            );
          } else {
            const optimisticMatchIndex = prev.findIndex(
              m =>
                typeof m.id === 'string' &&
                m.id.startsWith('temp-') &&
                m.content === message.content,
            );
            if (optimisticMatchIndex !== -1) {
              const updated = [...prev];
              updated[optimisticMatchIndex] = {
                ...message,
                replyTo: message.replyTo || updated[optimisticMatchIndex].replyTo,
              };
              nextMsgs = updated;
            } else {
              nextMsgs = [...prev, message];
            }
          }
          saveMessagesToCache(nextMsgs);
          return nextMsgs;
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // If the message is from the other user, mark as read immediately
        if (isFromOther && otherUserIdRef.current) {
          markMessagesRead(otherUserIdRef.current);
          ChatSocketService.sendRead(otherUserIdRef.current);
        }
      }
    },
    [],
  );

  // Typing notification handler from WebSocket
  const handleTyping = useCallback(
    (sender: any) => {
      console.log('[ChatScreen] handleTyping called with:', sender);
      let senderStr = '';
      if (typeof sender === 'object' && sender !== null) {
        senderStr = String(
          sender.senderId ??
          sender.userId ??
          sender.id ??
          sender.sender ??
          sender.from ??
          sender.email ??
          '',
        ).trim().toLowerCase();
      } else {
        senderStr = String(sender ?? '').trim().toLowerCase();
      }

      const userIdStr = String(otherUserIdRef.current ?? '').trim().toLowerCase();
      const emailStr = String(otherUserEmailRef.current ?? '').trim().toLowerCase();
      const nameStr = String(otherUserNameRef.current ?? '').trim().toLowerCase();
      const myIdStr = String(currentUserIdRef.current ?? '').trim().toLowerCase();
      const myEmailStr = String(userEmailRef.current ?? '').trim().toLowerCase();

      // Ignore our own typing events echoed back by the server
      if (
        (myIdStr.length > 0 && senderStr === myIdStr) ||
        (myEmailStr.length > 0 && senderStr === myEmailStr)
      ) {
        return;
      }

      const isMatch =
        (userIdStr.length > 0 && senderStr === userIdStr) ||
        (emailStr.length > 0 && senderStr === emailStr) ||
        (nameStr.length > 0 && senderStr === nameStr) ||
        // In this private 1-on-1 chat, any non-self typing notification belongs to the other user
        (senderStr.length > 0 && senderStr !== myIdStr && senderStr !== myEmailStr) ||
        (!senderStr && sender);

      if (isMatch) {
        if (!otherUserEmailRef.current && senderStr.includes('@')) {
          otherUserEmailRef.current = senderStr;
        }
        setIsOtherTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false);
          typingTimeoutRef.current = null;
        }, 3500);
      }
    },
    [],
  );

  // Local storage cache helpers
  const saveMessagesToCache = useCallback(
    async (msgs: ChatMessagePayload[]) => {
      const myId = currentUserIdRef.current;
      const targetId = otherUserIdRef.current;
      if (!myId || !targetId || !msgs) return;
      try {
        const key = `@chat_cache_${myId}_${targetId}`;
        const trimmed = msgs.slice(-200);
        await AsyncStorage.setItem(key, JSON.stringify(trimmed));
      } catch (e) {
        console.log('Error caching messages to local storage:', e);
      }
    },
    [],
  );

  // Read receipt handler (only mark as read if read by the user in this conversation)
  const handleReadReceipt = useCallback((data: any) => {
    console.log('[ChatScreen] Read receipt event received:', data);
    let readerId = data;
    if (typeof data === 'object' && data !== null) {
      readerId = data.readerId ?? data.userId ?? data.id;
    }
    // Only mark messages in this chat as read if the reader is the other user
    if (
      String(readerId) === String(otherUserIdRef.current) ||
      (typeof readerId === 'string' &&
        otherUserEmailRef.current &&
        readerId.toLowerCase() === otherUserEmailRef.current.toLowerCase())
    ) {
      setMessages(prev => {
        const updated = prev.map(m => {
          const isMine =
            String(m.senderId) === String(currentUserIdRef.current) ||
            m.senderId === 'me';
          if (isMine) {
            return { ...m, isRead: true };
          }
          return m;
        });
        saveMessagesToCache(updated);
        return updated;
      });
    }
  }, [saveMessagesToCache]);

  // Load chat history from REST API
  const loadHistory = async (pageNum: number) => {
    const targetId = otherUserIdRef.current;
    if (!targetId) return;
    try {
      if (pageNum === 0) {
        // Only set loading history if no cached messages are already showing
        setIsLoadingHistory(prev => (messages.length === 0 ? true : false));
      } else {
        setIsLoadingMore(true);
      }

      const data = await getChatHistory(targetId, pageNum, 20);
      if (data && data.content) {
        // Backend returns newest first; reverse so oldest is displayed on top
        const newMessages = [...data.content].reverse();

        // Check if there are theme sync messages in history
        const latestThemeMsg = newMessages
          .slice()
          .reverse()
          .find((m: any) => m.content && String(m.content).startsWith('__THEME_CHANGE__:'));
        if (latestThemeMsg && pageNum === 0) {
          try {
            const parsedTheme = JSON.parse(
              String(latestThemeMsg.content).slice('__THEME_CHANGE__:'.length),
            );
            if (parsedTheme.bg !== undefined) setCustomBgColor(parsedTheme.bg);
            if (parsedTheme.bubble !== undefined) setCustomBubbleColor(parsedTheme.bubble);
            if (parsedTheme.pattern !== undefined) setCustomPattern(Boolean(parsedTheme.pattern));
          } catch (e) {}
        }

        setMessages(prev => {
          const map = new Map<string, ChatMessagePayload>();
          const all = pageNum === 0 ? [...newMessages, ...prev] : [...newMessages, ...prev];

          all.forEach(m => {
            const k =
              m.id !== undefined && m.id !== null
                ? `id_${String(m.id)}`
                : `temp_${m.createdAt || ''}_${m.content || ''}`;
            if (!map.has(k)) {
              map.set(k, m);
            }
          });

          const merged = Array.from(map.values()).sort((a, b) => {
            const tA = new Date(a.createdAt || 0).getTime();
            const tB = new Date(b.createdAt || 0).getTime();
            return tA - tB;
          });

          saveMessagesToCache(merged);
          return merged;
        });

        setHasMore(!data.last);

        if (pageNum === 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 40);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 150);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 350);
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMore(false);
      if (pageNum === 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 60);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 250);
      }
    }
  };

  // Initialize chat session (Offline-first: Loads from AsyncStorage first, then syncs with API)
  const init = async () => {
    try {
      const storedUserId =
        (await AsyncStorage.getItem('userId')) || user?.id || null;
      setCurrentUserId(storedUserId);
      currentUserIdRef.current = storedUserId;

      const targetId = otherUserIdRef.current;

      // 1. Instant load from local storage cache
      if (storedUserId && targetId) {
        try {
          const key = `@chat_cache_${storedUserId}_${targetId}`;
          const cachedRaw = await AsyncStorage.getItem(key);
          if (cachedRaw) {
            const cached: ChatMessagePayload[] = JSON.parse(cachedRaw);
            if (Array.isArray(cached) && cached.length > 0) {
              setMessages(cached);
              setIsLoadingHistory(false);
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 40);
            }
          }
        } catch (e) {
          console.log('Error loading local chat cache:', e);
        }
      }

      // 2. Load latest chat history from REST API in background
      await loadHistory(0);

      // 3. Mark messages as read via REST API + socket
      markChatAsRead();
    } catch (e) {
      console.error('Error during chat init:', e);
    }
  };

  // Connect socket and listen
  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      try {
        console.log('[ChatScreen] Initializing chat for user:', otherUserId);

        await init();

        if (!mounted) return;

        await ChatSocketService.connect(
          () => {
            if (!mounted) return;
            console.log('🟢 [ChatScreen] Socket connected');
            markChatAsRead();
          },
          (message) => {
            if (!mounted) return;
            console.log('🔥 [ChatScreen] REAL-TIME MESSAGE:', message);
            handleIncomingMessage(message);
          },
          (typingSender) => {
            if (!mounted) return;
            handleTyping(typingSender);
          },
          (error) => {
            if (!mounted) return;
            console.warn('🔴 [ChatScreen] Socket error:', error);
          },
          (readData) => {
            if (!mounted) return;
            handleReadReceipt(readData);
          },
          (themeData) => {
            if (!mounted) return;
            handleRemoteThemeUpdate(themeData);
          },
        );
      } catch (error: any) {
        console.error(
          '[ChatScreen] Socket initialization failed:',
          error?.message || error,
        );
      }
    };

    initializeChat();

    return () => {
      mounted = false;
      console.log('[ChatScreen] Removing socket listeners');
      ChatSocketService.detachListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [otherUserId]);

  // Auto scroll down when other user is typing so the bubble is visible
  useEffect(() => {
    if (isOtherTyping) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOtherTyping]);

  // Load more older messages when scrolling to top
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoadingHistory) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHistory(nextPage);
    }
  };

  // Send plain text message
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !otherUserId) return;

    const replyId = replyingTo?.id;
    const replySnapshot = replyingTo
      ? {
          id: replyingTo.id ?? Date.now(),
          senderId: replyingTo.senderId,
          senderName:
            String(replyingTo.senderId) === String(currentUserId) ||
            replyingTo.senderId === 'me'
              ? 'You'
              : otherUserName,
          content: replyingTo.content,
          mediaUrl: replyingTo.mediaUrl,
          mediaType: replyingTo.mediaType,
        }
      : null;

    ChatSocketService.sendMessage(otherUserId, trimmed, replyId);

    // Optimistically add to UI
    const optimisticMsg: ChatMessagePayload = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      senderId: currentUserId || 'me',
      receiverId: otherUserId,
      createdAt: new Date().toISOString(),
      isRead: false,
      replyTo: replySnapshot,
      replyToMessageId: replyId,
    };

    setMessages(prev => {
      const next = [...prev, optimisticMsg];
      saveMessagesToCache(next);
      return next;
    });
    setInputText('');
    setReplyingTo(null);
    setShowEmoji(false);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Pick Image from Gallery
  const handlePickImage = async () => {
    setShowAttachMenu(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri!,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          isVideo: false,
        });
        setMediaCaption('');
      }
    } catch (e) {
      console.log('Error picking image:', e);
    }
  };

  // Pick Video from Gallery
  const handlePickVideo = async () => {
    setShowAttachMenu(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
      });

      if (result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri!,
          type: asset.type || 'video/mp4',
          fileName: asset.fileName || `video_${Date.now()}.mp4`,
          isVideo: true,
        });
        setMediaCaption('');
      }
    } catch (e) {
      console.log('Error picking video:', e);
    }
  };

  // Take photo using camera
  const handleTakePhoto = async () => {
    setShowAttachMenu(false);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri!,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `camera_${Date.now()}.jpg`,
          isVideo: false,
        });
        setMediaCaption('');
      }
    } catch (e) {
      console.log('Error launching camera:', e);
    }
  };

  // Send Media via upload API and socket.io
  const handleSendMedia = async () => {
    if (!selectedMedia || !otherUserId || isUploadingMedia) return;

    setIsUploadingMedia(true);
    try {
      const mediaType = selectedMedia.isVideo ? 'video' : 'image';
      const uploadRes = await uploadService.uploadMedia(selectedMedia, mediaType);

      if (!uploadRes || !uploadRes.url) {
        throw new Error('No URL returned from upload server');
      }

      const mediaUrl = uploadRes.url;

      // 1. Send media URL over WebSocket
      ChatSocketService.sendMessage(otherUserId, mediaUrl);

      const optimisticMediaMsg: ChatMessagePayload = {
        id: `temp-${Date.now()}`,
        content: mediaUrl,
        senderId: currentUserId || 'me',
        receiverId: otherUserId,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      let currentList: ChatMessagePayload[] = [];
      setMessages(prev => {
        currentList = [...prev, optimisticMediaMsg];
        saveMessagesToCache(currentList);
        return currentList;
      });

      // 2. If caption provided, send caption as follow-up
      if (mediaCaption.trim()) {
        const caption = mediaCaption.trim();
        ChatSocketService.sendMessage(otherUserId, caption);

        const optimisticCaptionMsg: ChatMessagePayload = {
          id: `temp-${Date.now() + 1}`,
          content: caption,
          senderId: currentUserId || 'me',
          receiverId: otherUserId,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setMessages(prev => {
          const next = [...prev, optimisticCaptionMsg];
          saveMessagesToCache(next);
          return next;
        });
      }

      setSelectedMedia(null);
      setMediaCaption('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('Failed to upload/send media:', err);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: err?.message || 'Could not upload media. Please try again.',
      });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Handle typing inside text input
  const handleTypingInput = (text: string) => {
    setInputText(text);
    const targetId = otherUserIdRef.current || otherUserId;
    if (!targetId) return;

    const now = Date.now();
    // Throttle typing notification to once every 1.5 seconds
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      ChatSocketService.sendTyping(targetId);
    }
  };

  // Toggle emoji selector
  const toggleEmoji = () => {
    if (!showEmoji) {
      Keyboard.dismiss();
    }
    setShowEmoji(prev => !prev);
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const renderMessage = ({ item }: { item: ChatMessagePayload }) => {
    const isMine =
      String(item.senderId) === String(currentUserId) ||
      item.senderId === 'me';
    const isMedia = isImageUrl(item.content);
    const activeBubbleColor = customBubbleColor || colors.primary;

    // Handle Theme Change notification pill (Instagram / Messenger style)
    if (item.content && item.content.startsWith('__THEME_CHANGE__:')) {
      let themeInfo: any = {};
      try {
        themeInfo = JSON.parse(item.content.slice('__THEME_CHANGE__:'.length));
      } catch {}
      const actor = isMine ? 'You' : otherUserName;
      const themeLabel = themeInfo.themeName ? `to ${themeInfo.themeName}` : 'theme';

      return (
        <View style={styles.themeNoticeRow}>
          <View
            style={[
              styles.themeNoticePill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={12}
              color={activeBubbleColor}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.themeNoticeText, { color: colors.textSecondary }]}>
              {actor} changed the chat {themeLabel}
            </Text>
          </View>
        </View>
      );
    }

    const handleSwipeToReply = (msg: ChatMessagePayload) => {
      setReplyingTo(msg);
      setShowEmoji(false);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    };

    const isSelected =
      item.id !== undefined && item.id !== null && selectedMessageIds.has(item.id);

    return (
      <SwipeableMessageBubble
        onSwipeReply={() => handleSwipeToReply(item)}
        bubbleColor={activeBubbleColor}
      >
        <Pressable
          onLongPress={() => handleMessageLongPress(item)}
          onPress={() => handleMessagePress(item)}
          delayLongPress={220}
          style={[
            styles.messageRow,
            isMine ? styles.messageRowMe : styles.messageRowOther,
            isSelected && styles.messageRowSelected,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMine
                ? [
                    styles.bubbleMe,
                    {
                      backgroundColor: activeBubbleColor,
                      borderWidth: 1.2,
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      borderTopColor: 'rgba(255, 255, 255, 0.45)',
                      borderBottomColor: 'rgba(0, 0, 0, 0.4)',
                      shadowColor: activeBubbleColor,
                      shadowOpacity: isDark ? 0.6 : 0.35,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 4,
                    },
                  ]
                : [
                    styles.bubbleOther,
                    neu.cardElevated({ radius: 18, depth: 'low' }),
                    {
                      backgroundColor: isDark ? '#1b1f26' : '#ffffff',
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      borderBottomRightRadius: 18,
                      borderBottomLeftRadius: 4,
                    },
                  ],
              isMedia && styles.mediaBubble,
              isSelected && {
                borderColor: '#6366f1',
                borderWidth: 1.8,
                backgroundColor: isMine ? activeBubbleColor : (isDark ? '#262d3d' : '#e0e7ff'),
              },
            ]}
          >
            {/* Quoted Message Header if this is a reply */}
            {item.replyTo && (() => {
              const isQuotedImage = Boolean(
                item.replyTo.mediaUrl || isImageUrl(item.replyTo.content),
              );
              const quotedImageUri =
                item.replyTo.mediaUrl ||
                (isImageUrl(item.replyTo.content) ? item.replyTo.content : null);

              return (
                <View
                  style={[
                    styles.quotedReplyCard,
                    {
                      backgroundColor: isMine
                        ? 'rgba(0, 0, 0, 0.22)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quoteAccentBar,
                      {
                        backgroundColor: isMine ? '#ffffff' : activeBubbleColor,
                      },
                    ]}
                  />

                  <View style={styles.quoteTextCol}>
                    <Text
                      style={[
                        styles.quotedSenderName,
                        {
                          color: isMine ? '#ffffff' : activeBubbleColor,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.replyTo.senderName ||
                        (String(item.replyTo.senderId) === String(currentUserId)
                          ? 'You'
                          : otherUserName)}
                    </Text>
                    <View style={styles.quoteSnippetRow}>
                      {isQuotedImage && (
                        <Ionicons
                          name="camera"
                          size={13}
                          color={
                            isMine
                              ? 'rgba(255, 255, 255, 0.9)'
                              : colors.textSecondary
                          }
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.quotedContentText,
                          {
                            color: isMine
                              ? 'rgba(255, 255, 255, 0.88)'
                              : colors.textSecondary,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {isQuotedImage ? 'Photo' : item.replyTo.content}
                      </Text>
                    </View>
                  </View>

                  {isQuotedImage && quotedImageUri && (
                    <Image
                      source={{ uri: quotedImageUri }}
                      style={styles.quoteThumbnail}
                      resizeMode="cover"
                    />
                  )}
                </View>
              );
            })()}

            {isMedia ? (
              <View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setFullScreenImage(item.content)}
                  style={styles.imageBubbleContainer}
                >
                  <Image
                    source={{ uri: item.content }}
                    style={styles.chatImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <View style={[styles.metaRow, styles.metaRowMedia]}>
                  <Text style={[styles.messageTime, styles.timeMedia]}>
                    {formatMessageTime(item.createdAt)}
                  </Text>
                  {isMine && (
                    <Text
                      style={[
                        styles.readReceipt,
                        item.isRead ? styles.readReceiptDone : styles.readReceiptSent,
                      ]}
                    >
                      {item.isRead ? ' ✓✓' : ' ✓'}
                    </Text>
                  )}
                </View>
              </View>
            ) : (() => {
              const isShortSingleLine =
                !item.replyTo &&
                typeof item.content === 'string' &&
                !item.content.includes('\n') &&
                item.content.length <= 26;

              if (isShortSingleLine) {
                return (
                  <View style={styles.singleLineRow}>
                    <Text
                      style={[
                        styles.messageContentSingle,
                        { color: isMine ? '#ffffff' : colors.text },
                      ]}
                    >
                      {item.content}
                    </Text>
                    <View style={styles.metaRowSingle}>
                      <Text
                        style={[
                          styles.messageTime,
                          isMine
                            ? styles.timeMe
                            : [styles.timeOther, { color: colors.textMuted }],
                        ]}
                      >
                        {formatMessageTime(item.createdAt)}
                      </Text>
                      {isMine && (
                        <Text
                          style={[
                            styles.readReceipt,
                            item.isRead ? styles.readReceiptDone : styles.readReceiptSent,
                          ]}
                        >
                          {item.isRead ? ' ✓✓' : ' ✓'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }

              return (
                <View style={styles.multiLineContainer}>
                  <Text
                    style={[
                      styles.messageContentMulti,
                      { color: isMine ? '#ffffff' : colors.text },
                    ]}
                  >
                    {item.content}
                  </Text>
                  <View style={styles.metaRowMulti}>
                    <Text
                      style={[
                        styles.messageTime,
                        isMine
                          ? styles.timeMe
                          : [styles.timeOther, { color: colors.textMuted }],
                      ]}
                    >
                      {formatMessageTime(item.createdAt)}
                    </Text>
                    {isMine && (
                      <Text
                        style={[
                          styles.readReceipt,
                          item.isRead ? styles.readReceiptDone : styles.readReceiptSent,
                        ]}
                      >
                        {item.isRead ? ' ✓✓' : ' ✓'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })()}
          </View>
        </Pressable>
      </SwipeableMessageBubble>
    );
  };

  const activeBgColor = customBgColor || colors.background;
  const activeBubbleColor = customBubbleColor || colors.primary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeBgColor }]}>
      <FocusAwareStatusBar
        backgroundColor={colors.surface}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={false}
      />

      {/* Top Navigation Header OR Multi-Message Selection Action Bar */}
      {isSelectionMode ? (
        <View
          style={[
            styles.header,
            styles.selectionHeader,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.selectionLeftRow}>
            <TouchableOpacity
              style={[styles.backButton, neu.circleButton(38, { depth: 'low' })]}
              onPress={clearSelection}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.selectionCountText, { color: colors.text }]}>
              {selectedMessageIds.size}
            </Text>
          </View>

          <View style={styles.selectionActionsRow}>
            {/* Quick Reply: Single message only */}
            {selectedMessageIds.size === 1 && (
              <TouchableOpacity
                style={[
                  styles.headerActionBtn,
                  neu.circleButton(38, { depth: 'low' }),
                  { marginRight: 6 },
                ]}
                onPress={handleReplySelected}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="reply" size={20} color={colors.text} />
              </TouchableOpacity>
            )}

            {/* Pin / Unpin: Single message only */}
            {selectedMessageIds.size === 1 && (
              <TouchableOpacity
                style={[
                  styles.headerActionBtn,
                  neu.circleButton(38, { depth: 'low' }),
                  { marginRight: 6 },
                ]}
                onPress={handlePinSelected}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={
                    pinnedMessage?.id === Array.from(selectedMessageIds)[0]
                      ? 'pin'
                      : 'pin-outline'
                  }
                  size={20}
                  color={
                    pinnedMessage?.id === Array.from(selectedMessageIds)[0]
                      ? activeBubbleColor
                      : colors.text
                  }
                />
              </TouchableOpacity>
            )}

            {/* Copy Action */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                neu.circleButton(38, { depth: 'low' }),
                { marginRight: 6 },
              ]}
              onPress={handleCopySelected}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="content-copy" size={19} color={colors.text} />
            </TouchableOpacity>

            {/* Forward Action */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                neu.circleButton(38, { depth: 'low' }),
                { marginRight: 6 },
              ]}
              onPress={handleForwardSelected}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-redo" size={19} color={colors.text} />
            </TouchableOpacity>

            {/* Delete Action */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                neu.circleButton(38, { depth: 'low' }),
              ]}
              onPress={handleDeleteSelected}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.backButton, neu.circleButton(38, { depth: 'low' })]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerUserRow}
            onPress={() =>
              navigation.navigate('UserProfile', {
                userId: otherUserId,
                user: recipient,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatarWrapper,
                  neu.sunkenWell(42),
                  {
                    borderColor: isOtherTyping
                      ? activeBubbleColor
                      : isDark
                      ? 'rgba(0,0,0,0.8)'
                      : 'rgba(0,0,0,0.08)',
                  },
                ]}
              >
                <Image
                  source={
                    otherUserProfileImage
                      ? { uri: otherUserProfileImage }
                      : defaultUser
                  }
                  style={styles.avatar}
                />
              </View>
              <View
                style={[
                  styles.onlineBadge,
                  {
                    backgroundColor: isOtherTyping ? activeBubbleColor : '#22c55e',
                    borderColor: colors.surface,
                  },
                ]}
              />
            </View>

            <View style={styles.headerTitleBox}>
              <Text style={[styles.recipientName, { color: colors.text }]} numberOfLines={1}>
                {otherUserName}
              </Text>
              <View style={styles.statusRow}>
                {isOtherTyping ? (
                  <Text style={[styles.typingStatusText, { color: activeBubbleColor }]}>
                    typing...
                  </Text>
                ) : (
                  <View style={styles.onlineBadgeTextRow}>
                    <View style={styles.activeDot} />
                    <Text style={[styles.onlineStatusText, { color: colors.textSecondary }]}>
                      Active now
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Header Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionBtn, neu.circleButton(38, { depth: 'low' })]}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={17} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                neu.circleButton(38, { depth: 'low' }),
                { marginLeft: 6 },
              ]}
              onPress={() => setShowOptionsMenu(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-vertical" size={17} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <View
          style={[
            styles.pinnedBanner,
            {
              backgroundColor: isDark
                ? 'rgba(30, 36, 48, 0.95)'
                : 'rgba(243, 244, 246, 0.95)',
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.pinnedBannerContent}
            onPress={() => {
              const idx = messages.findIndex(m => m.id === pinnedMessage.id);
              if (idx !== -1) {
                flatListRef.current?.scrollToIndex({ index: idx, animated: true });
              }
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.pinnedAccentBar,
                { backgroundColor: activeBubbleColor },
              ]}
            />
            <Ionicons
              name="pin"
              size={15}
              color={activeBubbleColor}
              style={{ marginRight: 6 }}
            />
            <View style={styles.pinnedTextCol}>
              <Text
                style={[styles.pinnedBannerTitle, { color: activeBubbleColor }]}
              >
                Pinned Message
              </Text>
              <Text
                style={[
                  styles.pinnedBannerSnippet,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {pinnedMessage.mediaUrl || isImageUrl(pinnedMessage.content)
                  ? '📷 Photo'
                  : pinnedMessage.content}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pinnedCloseBtn}
            onPress={() => setPinnedMessage(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close"
              size={17}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Chat Feed */}
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: activeBgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Subtle Background Pattern Overlay */}
        {customPattern && <ChatPatternOverlay isDark={isDark} />}

        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={activeBubbleColor} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading conversation...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            extraData={selectedMessageIds}
            keyExtractor={(item, index) =>
              item.id !== undefined && item.id !== null
                ? `msg_${String(item.id)}`
                : `temp_${index}_${item.createdAt || ''}`
            }
            renderItem={renderMessage}
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            updateCellsBatchingPeriod={50}
            windowSize={11}
            removeClippedSubviews={Platform.OS === 'android'}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.1}
            onStartReached={handleLoadMore}
            ListHeaderComponent={
              isLoadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={activeBubbleColor} />
                </View>
              ) : (
                <View style={styles.dateHeader}>
                  <View style={[styles.dateBadge, neu.badgeEmbossed()]}>
                    <Text style={[styles.dateHeaderText, { color: colors.textSecondary }]}>
                      Today
                    </Text>
                  </View>
                </View>
              )
            }
            ListFooterComponent={
              <TypingIndicator visible={isOtherTyping} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    neu.circleButton(68, { depth: 'low' }),
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={36}
                    color={activeBubbleColor}
                  />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Say hello to {otherUserName}!
                </Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                  Direct messages are secure and real-time.
                </Text>
              </View>
            }
            keyboardShouldPersistTaps="always"
            onLayout={() => {
              if (!isLoadingMore) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onContentSizeChange={() => {
              if (!isLoadingMore) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        {/* Emoji Selector Panel */}
        {showEmoji && (
          <View
            style={[
              styles.emojiContainer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <EmojiSelector
              onEmojiSelected={(emoji: string) =>
                setInputText(prev => prev + emoji)
              }
              showSearchBar={false}
              showTabs={true}
              showHistory={true}
              columns={8}
              theme={activeBubbleColor}
            />
          </View>
        )}

        {/* Reply Preview Bar (Shows above input when replying to a message) */}
        {replyingTo && (() => {
          const isQuotedImage = Boolean(
            replyingTo.mediaUrl || isImageUrl(replyingTo.content),
          );
          const quotedImageUri =
            replyingTo.mediaUrl ||
            (isImageUrl(replyingTo.content) ? replyingTo.content : null);

          return (
            <View
              style={[
                styles.replyBarWrapper,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.replyBarInner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.replyBarAccentBar,
                    { backgroundColor: activeBubbleColor },
                  ]}
                />
                <View style={styles.replyBarTextCol}>
                  <Text
                    style={[styles.replyBarAuthor, { color: activeBubbleColor }]}
                    numberOfLines={1}
                  >
                    Replying to{' '}
                    {String(replyingTo.senderId) === String(currentUserId) ||
                    replyingTo.senderId === 'me'
                      ? 'yourself'
                      : otherUserName}
                  </Text>
                  <View style={styles.quoteSnippetRow}>
                    {isQuotedImage && (
                      <Ionicons
                        name="camera"
                        size={13}
                        color={colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.replyBarSnippet,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {isQuotedImage ? 'Photo' : replyingTo.content}
                    </Text>
                  </View>
                </View>

                {isQuotedImage && quotedImageUri && (
                  <Image
                    source={{ uri: quotedImageUri }}
                    style={styles.quoteThumbnail}
                    resizeMode="cover"
                  />
                )}

                <TouchableOpacity
                  onPress={() => setReplyingTo(null)}
                  style={styles.replyBarCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={isDark ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* Modern Bottom Input Bar */}
        <View
          style={[
            styles.inputBarWrapper,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputCapsule,
              neu.fieldSunken({ radius: 24 }),
            ]}
          >
            <TouchableOpacity
              onPress={toggleEmoji}
              style={styles.iconInsideInput}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showEmoji ? 'keypad' : 'happy'}
                size={22}
                color={showEmoji ? activeBubbleColor : (isDark ? '#9ca3af' : '#6b7280')}
              />
            </TouchableOpacity>

            <TextInput
              ref={textInputRef}
              style={[styles.textInput, { color: colors.inputText }]}
              placeholder="Message..."
              placeholderTextColor={colors.placeholderText}
              value={inputText}
              onChangeText={handleTypingInput}
              onFocus={() => setShowEmoji(false)}
              multiline
            />

            {/* Media & Camera Inside Input Bar */}
            <TouchableOpacity
              style={styles.iconInsideInput}
              onPress={() => setShowAttachMenu(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="attach" size={22} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconInsideInput}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="camera" size={21} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {/* Action Button: Send or Mic */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              neu.circleButton(46, { depth: 'high' }),
              {
                backgroundColor: activeBubbleColor,
                shadowColor: activeBubbleColor,
              },
            ]}
            onPress={handleSend}
            activeOpacity={0.85}
          >
            <Ionicons
              name={inputText.trim().length > 0 ? 'send' : 'mic'}
              size={inputText.trim().length > 0 ? 17 : 20}
              color="#ffffff"
              style={inputText.trim().length > 0 ? { marginLeft: 2 } : undefined}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable
          style={styles.menuModalOverlay}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View
            style={[
              styles.optionsMenuCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.optionMenuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                setTempBgColor(customBgColor);
                setTempBubbleColor(customBubbleColor);
                setTempPattern(customPattern);
                setShowThemeModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconBox, { backgroundColor: activeBubbleColor + '18' }]}>
                <Ionicons name="color-palette-outline" size={20} color={activeBubbleColor} />
              </View>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionMenuTitle, { color: colors.text }]}>Customize Theme</Text>
                <Text style={[styles.optionMenuSubtitle, { color: colors.textSecondary }]}>Change bubble & wallpaper</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.optionMenuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                navigation.navigate('UserProfile', {
                  userId: otherUserId,
                  user: recipient,
                });
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="person-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionMenuTitle, { color: colors.text }]}>View Profile</Text>
                <Text style={[styles.optionMenuSubtitle, { color: colors.textSecondary }]}>Info, media and settings</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.optionMenuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                Alert.alert('Clear Chat', 'Do you want to clear conversation messages on this screen?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) },
                ]);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconBox, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </View>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionMenuTitle, { color: '#ef4444' }]}>Clear Messages</Text>
                <Text style={[styles.optionMenuSubtitle, { color: colors.textSecondary }]}>Clear messages locally</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Theme Customization Bottom Sheet Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable
          style={styles.themeModalOverlay}
          onPress={() => setShowThemeModal(false)}
        >
          <Pressable
            style={[
              styles.themeModalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.themeHeaderRow}>
              <Text style={[styles.themeModalTitle, { color: colors.text }]}>Chat Wallpapers & Colors</Text>
              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
                style={[styles.themeCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.themeScrollContent}>
              {/* Live Preview Box */}
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: tempBgColor || (isDark ? '#16181b' : '#f4f6f9'),
                    borderColor: colors.border,
                  },
                ]}
              >
                {tempPattern && <ChatPatternOverlay isDark={isDark} />}
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>PREVIEW</Text>
                <View style={[styles.previewBubbleOther, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.previewBubbleText, { color: colors.text }]}>Hey! How do you like this wallpaper? ✨</Text>
                </View>
                <View style={[styles.previewBubbleMe, { backgroundColor: tempBubbleColor || colors.primary }]}>
                  <Text style={styles.previewBubbleTextMe}>Looks stylish and personalized! 🚀</Text>
                </View>
              </View>

              {/* Doodle Pattern Texture Toggle */}
              <TouchableOpacity
                style={[
                  styles.patternToggleCard,
                  {
                    backgroundColor: tempPattern
                      ? (tempBubbleColor || colors.primary) + '15'
                      : colors.surfaceSubtle,
                    borderColor: tempPattern
                      ? (tempBubbleColor || colors.primary)
                      : colors.border,
                  },
                ]}
                onPress={() => setTempPattern(prev => !prev)}
                activeOpacity={0.7}
              >
                <View style={styles.patternToggleLeft}>
                  <View
                    style={[
                      styles.patternIconBox,
                      {
                        backgroundColor: tempPattern
                          ? (tempBubbleColor || colors.primary)
                          : colors.surface,
                      },
                    ]}
                  >
                    <Ionicons
                      name="sparkles"
                      size={18}
                      color={tempPattern ? '#ffffff' : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.patternToggleTextWrap}>
                    <Text style={[styles.patternToggleTitle, { color: colors.text }]}>
                      Chat Doodle Wallpaper Texture
                    </Text>
                    <Text style={[styles.patternToggleSub, { color: colors.textSecondary }]}>
                      Subtle Telegram/WhatsApp icon pattern
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.patternBadge,
                    {
                      backgroundColor: tempPattern
                        ? (tempBubbleColor || colors.primary)
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.patternBadgeText,
                      { color: tempPattern ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    {tempPattern ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Bubble Color Palette */}
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Chat Bubble Accent</Text>
              <View style={styles.colorPaletteGrid}>
                {BUBBLE_THEMES.map(theme => {
                  const isSelected = (tempBubbleColor === null && theme.id === 'default') || tempBubbleColor === theme.color;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={styles.colorItem}
                      onPress={() => setTempBubbleColor(theme.id === 'default' ? null : theme.color)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: theme.color },
                          isSelected && styles.colorCircleSelected,
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                      </View>
                      <Text
                        style={[
                          styles.colorName,
                          { color: isSelected ? colors.text : colors.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {theme.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Wallpaper / Background Header & Category Tabs */}
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Chat Wallpaper Designs</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryTabRow}
              >
                {WALLPAPER_CATEGORIES.map(cat => {
                  const isActive = wallpaperTab === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryTabBtn,
                        {
                          backgroundColor: isActive
                            ? (tempBubbleColor || colors.primary)
                            : colors.surfaceSubtle,
                          borderColor: isActive
                            ? (tempBubbleColor || colors.primary)
                            : colors.border,
                        },
                      ]}
                      onPress={() => setWallpaperTab(cat.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryTabLabel,
                          { color: isActive ? '#ffffff' : colors.textSecondary },
                          isActive && { fontWeight: '700' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Filtered Wallpaper Grid */}
              <View style={styles.colorPaletteGrid}>
                {BG_THEMES.filter(
                  theme =>
                    wallpaperTab === 'all' ||
                    theme.category === wallpaperTab ||
                    theme.id === 'default',
                ).map(theme => {
                  const targetBg = theme.id === 'default' ? null : (isDark ? theme.dark : theme.light);
                  const isSelected = (tempBgColor === null && theme.id === 'default') || tempBgColor === targetBg;
                  const displayColor = isDark ? theme.dark : theme.light;

                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={styles.colorItem}
                      onPress={() => setTempBgColor(theme.id === 'default' ? null : (isDark ? theme.dark : theme.light))}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: displayColor, borderWidth: 1, borderColor: colors.border },
                          isSelected && [styles.colorCircleSelected, { borderColor: tempBubbleColor || colors.primary }],
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={isDark ? '#ffffff' : '#111827'}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.colorName,
                          { color: isSelected ? colors.text : colors.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {theme.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={[styles.themeActionRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                onPress={() => {
                  setTempBgColor(null);
                  setTempBubbleColor(null);
                  setTempPattern(false);
                  handleSaveCustomTheme(null, null, false);
                  setShowThemeModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset Default</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: tempBubbleColor || colors.primary }]}
                onPress={() => {
                  handleSaveCustomTheme(tempBgColor, tempBubbleColor, tempPattern);
                  setShowThemeModal(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnText}>Apply Wallpaper</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Attachment Options Menu Modal */}
      <Modal
        visible={showAttachMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAttachMenu(false)}
        >
          <View
            style={[
              styles.attachMenuCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.attachMenuTitle, { color: colors.text }]}>
              Share Content
            </Text>

            <View style={styles.attachRow}>
              <TouchableOpacity
                style={styles.attachItem}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="images" size={26} color="#0284c7" />
                </View>
                <Text style={[styles.attachLabel, { color: colors.text }]}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachItem}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="camera" size={26} color="#d97706" />
                </View>
                <Text style={[styles.attachLabel, { color: colors.text }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachItem}
                onPress={handlePickVideo}
                activeOpacity={0.8}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#fce7f3' }]}>
                  <Ionicons name="videocam" size={26} color="#db2777" />
                </View>
                <Text style={[styles.attachLabel, { color: colors.text }]}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Media Preview Modal (Before Sending) */}
      <Modal
        visible={Boolean(selectedMedia)}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (!isUploadingMedia) {
            setSelectedMedia(null);
            setMediaCaption('');
          }
        }}
      >
        <SafeAreaView style={styles.previewModalContainer}>
          <StatusBar backgroundColor="#000000" barStyle="light-content" />

          {/* Top Bar with Cancel */}
          <View style={styles.previewTopBar}>
            <TouchableOpacity
              onPress={() => {
                if (!isUploadingMedia) {
                  setSelectedMedia(null);
                  setMediaCaption('');
                }
              }}
              style={styles.previewCloseBtn}
              activeOpacity={0.8}
              disabled={isUploadingMedia}
            >
              <Ionicons name="close" size={26} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.previewHeaderTitle}>
              {selectedMedia?.isVideo ? 'Preview Video' : 'Preview Photo'}
            </Text>

            <View style={{ width: 40 }} />
          </View>

          {/* Center Image Preview */}
          <View style={styles.previewImageContainer}>
            {selectedMedia?.uri ? (
              <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}

            {selectedMedia?.isVideo && (
              <View style={styles.videoBadge}>
                <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
              </View>
            )}

            {isUploadingMedia && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.uploadingText}>Uploading media...</Text>
              </View>
            )}
          </View>

          {/* Bottom Caption & Send Row */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          >
            <View style={styles.previewBottomBar}>
              <View style={styles.previewInputCapsule}>
                <TextInput
                  style={styles.previewTextInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="#9ca3af"
                  value={mediaCaption}
                  onChangeText={setMediaCaption}
                  editable={!isUploadingMedia}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.previewSendButton,
                  { backgroundColor: activeBubbleColor },
                  isUploadingMedia && { opacity: 0.7 },
                ]}
                onPress={handleSendMedia}
                disabled={isUploadingMedia}
                activeOpacity={0.85}
              >
                {isUploadingMedia ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="arrow-up" size={22} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={Boolean(fullScreenImage)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <SafeAreaView style={styles.fullScreenViewer}>
          <StatusBar backgroundColor="#000000" barStyle="light-content" />
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseBtn}
              onPress={() => setFullScreenImage(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.fullScreenImageWrap}>
            {fullScreenImage ? (
              <Image
                source={{ uri: fullScreenImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerUserRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  onlineBadgeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 5,
  },
  headerTitleBox: {
    flex: 1,
    justifyContent: 'center',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  typingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  onlineStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  loadingMoreContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  themeNoticeRow: {
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  themeNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  themeNoticeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  messageRow: {
    marginVertical: 2,
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 18,
  },
  mediaBubble: {
    paddingHorizontal: 3,
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 16,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1.5,
  },
  singleLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  messageContentSingle: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
    paddingRight: 8,
  },
  metaRowSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 1,
    gap: 1,
  },
  multiLineContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  messageContentMulti: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  metaRowMulti: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 1,
  },
  imageBubbleContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  chatImage: {
    width: SCREEN_WIDTH * 0.64,
    height: SCREEN_WIDTH * 0.64,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
    marginBottom: 1,
    gap: 1,
  },
  metaRowMedia: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  messageTime: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  timeMedia: {
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeOther: {
    color: '#8b949e',
  },
  readReceipt: {
    fontSize: 11,
    marginLeft: 3,
    fontWeight: '700',
  },
  readReceiptDone: {
    color: '#a5f3fc',
  },
  readReceiptSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  emojiContainer: {
    height: 260,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 8,
    minHeight: 46,
    maxHeight: 110,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    paddingHorizontal: 6,
    maxHeight: 90,
  },
  iconInsideInput: {
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Options Menu Modal */
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingRight: 16,
  },
  optionsMenuCard: {
    width: 230,
    borderRadius: 18,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  optionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextBox: {
    flex: 1,
  },
  optionMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionMenuSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },

  /* Theme Customization Modal */
  themeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  themeModalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: SCREEN_HEIGHT * 0.82,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  themeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  themeCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  previewBox: {
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  previewBubbleOther: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomLeftRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  previewBubbleMe: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomRightRadius: 3,
  },
  previewBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewBubbleTextMe: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  /* Pattern Toggle Card */
  patternToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 18,
  },
  patternToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patternIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patternToggleTextWrap: {
    flex: 1,
  },
  patternToggleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  patternToggleSub: {
    fontSize: 11,
    marginTop: 1,
  },
  patternBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  patternBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Category Filter Tabs */
  categoryTabRow: {
    flexDirection: 'row',
    paddingBottom: 14,
    gap: 8,
  },
  categoryTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryTabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    gap: 12,
  },
  colorItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 40 - 36) / 4,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  colorName: {
    fontSize: 11,
    textAlign: 'center',
  },
  themeActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Attachment Action Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 14,
  },
  attachMenuCard: {
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 22,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  attachMenuTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
  },
  attachRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  attachItem: {
    alignItems: 'center',
  },
  attachIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  /* Media Preview Modal */
  previewModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewTopBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  previewCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  previewBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    gap: 8,
  },
  previewInputCapsule: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
    maxHeight: 100,
    justifyContent: 'center',
  },
  previewTextInput: {
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: 8,
  },
  previewSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Full Screen Image Viewer */
  fullScreenViewer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fullScreenCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },

  /* Swipe to Reply Styles */
  swipeableContainer: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  replyIconBehind: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeableContent: {
    width: '100%',
    zIndex: 2,
  },

  /* Quoted Reply Card Inside Message Bubble */
  quotedReplyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    minWidth: 140,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  quoteAccentBar: {
    width: 3.5,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 8,
  },
  quoteTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  quotedSenderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  quoteSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotedContentText: {
    fontSize: 12,
    lineHeight: 16,
  },
  quoteThumbnail: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginLeft: 8,
  },

  /* Reply Preview Bar Above Input Bar */
  replyBarWrapper: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  replyBarAccentBar: {
    width: 3.5,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 8,
  },
  replyBarTextCol: {
    flex: 1,
    marginRight: 8,
  },
  replyBarAuthor: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  replyBarSnippet: {
    fontSize: 12,
  },
  replyBarCloseBtn: {
    padding: 2,
  },

  /* Multi-Message Selection Header Styles */
  selectionHeader: {
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  selectionLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionCountText: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  selectionActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageRowSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 14,
    paddingVertical: 2,
  },

  /* Pinned Message Banner */
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  pinnedBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  pinnedAccentBar: {
    width: 3.5,
    height: 26,
    borderRadius: 2,
    marginRight: 8,
  },
  pinnedTextCol: {
    flex: 1,
  },
  pinnedBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  pinnedBannerSnippet: {
    fontSize: 12,
  },
  pinnedCloseBtn: {
    padding: 4,
  },
});



