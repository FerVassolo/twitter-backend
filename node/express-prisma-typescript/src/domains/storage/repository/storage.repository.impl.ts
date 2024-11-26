import {StorageRepository} from "@domains/storage/repository/storage.repository";
import dotenv from 'dotenv';
import {
  S3Client,
} from '@aws-sdk/client-s3';

dotenv.config();

export class StorageRepositoryImpl implements StorageRepository{
  private readonly s3Client: S3Client;

  // TODO: verificar que pueda acceder a las variables de entorno
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

}
