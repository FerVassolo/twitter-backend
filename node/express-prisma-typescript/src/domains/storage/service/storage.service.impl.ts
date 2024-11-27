import {StorageService} from "@domains/storage/service/storage.service";
import {StorageRepository, StorageRepositoryImpl} from "@domains/storage/repository";

export class StorageServiceImpl implements StorageService{

  private readonly storageRepository: StorageRepository
  constructor(storageRepository: StorageRepository) {
    this.storageRepository = new StorageRepositoryImpl()
  }

  createProfilePreSignedUrl(userId: string): Promise<string> {
    return this.storageRepository.createProfilePreSignedUrl(userId)
  }

  getProfilePreSignedUrl(userId: string): Promise<string> {
    return this.storageRepository.getProfilePreSignedUrl(userId)
  }

  createPostPreSignedUrl(userId: string, postId: string): Promise<string[]> {
    return this.storageRepository.createPostPreSignedUrls(userId, postId, [])
  }

  getPostPreSignedUrl(userId: string, postId: string): Promise<string[]> {
    return this.storageRepository.getPostPreSignedUrls(userId, postId)
  }
}
