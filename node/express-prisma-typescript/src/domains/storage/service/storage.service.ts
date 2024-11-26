
export interface StorageService{
  // Ahora bien, cómo se hace esto usando Pre-signed URLs?

  // This endpoints don't care about autentication, that is handled by the post and user controllers.
  // Each userId has a folder in the bucket. If they don't have one, it is created, with two inner folders: public and post.
  // the profile image is stored at /public/profile-image/image.png and it should be the only image in that folder.
/*  uploadProfileImage: (userId: number, image: string) => Promise<boolean>
  getProfileImage: (userId: number) => Promise<string>
  uploadPostImage: (userId: number, image: string) => Promise<boolean>
  getPostImage: (userId: number, image: string) => Promise<string>
  */

  createProfilePreSignedUrl: (userId: number, filename: string) => Promise<string>
  getProfilePreSignedUrl: (userId: number, filename: string) => Promise<string>
  createPostPreSignedUrl: (userId: number, filename: string) => Promise<string>
  getPostPreSignedUrl: (userId: number, filename: string) => Promise<string>
}
