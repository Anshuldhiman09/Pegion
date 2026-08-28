// src/services/AudioRoutingService.ts

import { NativeModules, Platform } from 'react-native';

const { AudioCallModule } = NativeModules;

export const AudioRoutingService = {
  setSpeakerphoneOn: (on: boolean): void => {
    console.log(`🔊 [AudioRouting] setSpeakerphoneOn: ${on}`);
    if (Platform.OS === 'android' && AudioCallModule?.setSpeakerphoneOn) {
      AudioCallModule.setSpeakerphoneOn(on).catch((err: any) => {
        console.warn('⚠️ [AudioRouting] setSpeakerphoneOn failed:', err);
      });
    }
  },

  startCallAudio: (isVideo: boolean): void => {
    console.log(`🔊 [AudioRouting] startCallAudio (isVideo: ${isVideo})`);
    if (Platform.OS === 'android' && AudioCallModule?.startCallAudio) {
      AudioCallModule.startCallAudio(isVideo).catch((err: any) => {
        console.warn('⚠️ [AudioRouting] startCallAudio failed:', err);
      });
    }
  },

  stopCallAudio: (): void => {
    console.log('🔊 [AudioRouting] stopCallAudio');
    if (Platform.OS === 'android' && AudioCallModule?.stopCallAudio) {
      AudioCallModule.stopCallAudio().catch((err: any) => {
        console.warn('⚠️ [AudioRouting] stopCallAudio failed:', err);
      });
    }
  },
};

export default AudioRoutingService;
