export type AuthStackParamList = {
  Signup: undefined;
  Otp: { phone: string };
  EditProfile: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Status: undefined;
  Calls: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
