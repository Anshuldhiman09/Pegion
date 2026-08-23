import apiClient from './client';

export interface MediaUploadResponse {
  url: string;
  type: string;
  duration?: number;
}

export const uploadService = {
  /**
   * Upload media (image, video, etc.) to backend /api/media/upload
   */
  uploadMedia: async (
    fileAsset: {
      uri: string;
      type?: string;
      fileName?: string;
    },
    mediaType: 'image' | 'video' | 'audio' = 'image',
  ): Promise<MediaUploadResponse | null> => {
    if (!fileAsset.uri) return null;

    const formData = new FormData();
    formData.append('file', {
      uri: fileAsset.uri,
      type: fileAsset.type || (mediaType === 'image' ? 'image/jpeg' : 'video/mp4'),
      name: fileAsset.fileName || `media_${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`,
    } as any);

    const response = await apiClient.post<MediaUploadResponse>(
      `/api/media/upload?type=${encodeURIComponent(mediaType)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  /**
   * Direct Cloudinary fallback for profile photos
   */
  uploadToCloudinary: async (imageAsset: {
    uri?: string;
    type?: string;
    fileName?: string;
  }): Promise<string | null> => {
    if (!imageAsset.uri) {
      return null;
    }
    const data = new FormData();

    data.append('file', {
      uri: imageAsset.uri,
      type: imageAsset.type || 'image/jpeg',
      name: imageAsset.fileName || 'profile.jpg',
    } as any);

    data.append('upload_preset', 'profile_pics');

    const res = await fetch(
      'https://api.cloudinary.com/v1_1/dcvkg8w7r/image/upload',
      {
        method: 'POST',
        body: data,
      },
    );

    const result = await res.json();
    return result?.secure_url || null;
  },
};

export default uploadService;
