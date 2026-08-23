export type AuthStackParamList = {
  Signup: undefined;
  Otp: { email: string };
};

export type MainTabParamList = {
  Chats: undefined;
  Search: undefined;
  Calls: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  SetupProfile: undefined;
  CompleteProfile: undefined;
  Main: undefined;
};

export type ProfileStackParamList = {
  ViewProfile: undefined;
  EditProfile: { mode?: 'setup' | 'edit' } | undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  AccountSettings: undefined;
  Privacy: undefined;
  Notifications: undefined;
  HelpAndSupport: undefined;
};
