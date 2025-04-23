import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { StorageRepository } from "@main/domains/storage/repository/storage.repository";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

// TODO: should I make a commons folder so this file is not so long?
export class StorageRepositoryImpl implements StorageRepository {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
    this.bucketName = process.env.AWS_BUCKET_NAME as string;
  }

  async createProfilePreSignedUrl(userId: string): Promise<string> {
    await this.ensureBaseProfileFoldersExist(userId);

    const profileImageFolderKey = `${userId}/public/profile-image/`;
    const filename = "image";
    console.log(`File does not exist: ${filename}`);
    // The old image is overwritten only when I upload a new image, not when I create the presigned url
    return this.createFileInFolder(profileImageFolderKey, filename);
  }

  async getProfilePreSignedUrl(userId: string): Promise<string | null> {
    const profileImageFolderKey = `${userId}/public/profile-image/`;

    const existingFile = await this.getExistingFileInFolder(profileImageFolderKey);

    if (existingFile) {
      return this.getFileInFolder(existingFile);
    } else {
      console.log(`No profile image found for user ${userId}`);
      return null
    }
  }

  async createPostPreSignedUrls(userId: string, postId: string, images: string[]): Promise<string[]> {
    const postFolderKey = `${userId}/post/${postId}/`;

    await this.ensureFolderExists(postFolderKey);

    const preSignedUrls = await Promise.all(
      images.map(async (filename) => {
        return this.createFileInFolder(postFolderKey, filename);
      })
    );

    return preSignedUrls;
  }


  async getPostPreSignedUrls(userId: string, postId: string): Promise<string[]> {
    const postFolderKey = `${userId}/post/${postId}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: postFolderKey,
    });

    try {
      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        throw new Error(`No files found for post ${postId} of user ${userId}`);
      }

      // Filter out the folder itself if it exists as an object (debería sacarlo esto?)
      const fileKeys = response.Contents.filter((item) => item.Key !== `${postFolderKey}`)
        .map((item) => item.Key!);

      const preSignedUrls = await Promise.all(
        fileKeys.map(async (fileKey) => {
          return this.getFileInFolder(fileKey);
        })
      );

      return preSignedUrls;
    } catch (error) {
      console.error(`Failed to get post pre-signed URLs: ${error}`);
      throw new Error(`Could not retrieve post pre-signed URLs for ${postId}`);
    }
  }


  private async getExistingFileInFolder(folderKey: string): Promise<string | null> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: folderKey,
    });

    const response = await this.s3Client.send(command);
    const files = response.Contents?.filter((item) => item.Key !== `${folderKey}`) || [];

    return files.length > 0 ? files[0].Key || null : null;
  }

  private async getFileInFolder(existingFile: string): Promise<string>{
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: existingFile,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 240 }); // you have four minutes to change the image
  }

  private async createFileInFolder(folderKey: string, filename: string): Promise<string>{
    const fileKey = `${folderKey}${filename}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 240 }); // you have four minutes to change the image
  }


  private async ensureBaseProfileFoldersExist(userId: string): Promise<void> {
    const baseKey = `${userId}/`;
    const publicFolderKey = `${baseKey}public/`;
    const profileImageFolderKey = `${publicFolderKey}profile-image/`;
    const postsFolderKey = `${baseKey}post/`;

    // Ensure all required folders exist
    await this.ensureFolderExists(baseKey);
    await this.ensureFolderExists(publicFolderKey);
    await this.ensureFolderExists(profileImageFolderKey);
    await this.ensureFolderExists(postsFolderKey);
  }

  private async ensureFolderExists(folderKey: string): Promise<void> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: folderKey,
        MaxKeys: 1,
      });
      const response = await this.s3Client.send(command);
      if (!response.Contents || response.Contents.length === 0) {
        // Create a placeholder object if the folder is empty
        await this.createFolder(folderKey);
      }
    } catch (error) {
      throw error; // Re-throw unexpected errors
    }
  }

  private async createFolder(folderKey: string): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${folderKey}`,
      })
    );
  }


}
