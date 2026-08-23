export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  statusCodes?: number;
  statusMsg?: string;
  message?: string;
}

export interface VerifyOtpData {
  email: string;
  name: string;
  newUser: boolean;
  token: string;
  username: string | null;
}

export interface ProfileData {
  id?: number;
  name?: string;
  email?: string;
  username?: string | null;
  description?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  profileImageUrl?: string | null;
  profileCompleteStatus?: boolean;
  newUser?: boolean;
  accountActiveStatus?: boolean;
  accountDeleteStatus?: boolean;
  emailVerify?: boolean;
  userRole?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;

  // UI convenience fallback aliases
  photo?: string | null;
  bio?: string | null;
  dob?: string | null;
}

export interface SetupProfilePayload {
  name: string;
  dateOfBirth?: string;
  gender?: string;
  description?: string;
}

export interface SearchUserItem {
  id: number;
  name: string;
  username: string;
  profileImageUrl: string | null;
}

export type ConnectionRequestAction = 'ACCEPT' | 'REJECT';

export interface ConnectionRequestItem {
  id: number;
  createdAt: string;
  sender: ProfileData;
  reciever: ProfileData;
}

export interface PageableResponse<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
  pageable?: {
    offset?: number;
    pageNumber?: number;
    pageSize?: number;
    paged?: boolean;
    unpaged?: boolean;
  };
}
