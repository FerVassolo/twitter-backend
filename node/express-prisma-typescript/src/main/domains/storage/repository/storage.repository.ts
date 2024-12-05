
export interface StorageRepository{
  // This endpoints don't care about autentication, that is handled by the post and user controllers.
  // Each userId has a folder in the bucket. If they don't have one, it is created, with two inner folders: public and post.
  // the profile image is stored at /public/profile-image/image.png and it should be the only image in that folder.
  // each post has a folder, /post/postId/image.png, /post/postId/image2.png, etc.

  createProfilePreSignedUrl: (userId: string) => Promise<string>
  getProfilePreSignedUrl: (userId: string) =>  Promise<string | null>
  createPostPreSignedUrls: (userId: string, postId: string, images: string[]) => Promise<string[]>
  getPostPreSignedUrls: (userId: string, postId: string) => Promise<string[]>
}
