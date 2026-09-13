import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!.trim();
const REGION = process.env.AWS_REGION!.trim();

export const S3_FOLDERS = {
  STAFF_DOCUMENTS: "documents/staff",
  SUPPORTING_DOCUMENTS: "documents/supporting",
  LGA_IMAGES: "images/lga",
  EXECUTIVE_IMAGES: "images/executives",
  HIGHLIGHT_IMAGES: "images/highlights",
} as const;

function getPublicUrl(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );
  return getPublicUrl(key);
}

export async function getPresignedUrl(key: string, filename?: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ...(filename ? { ContentDisposition: `attachment; filename="${filename}"` } : {}),
  });
  return getSignedUrl(s3Client, command, { expiresIn: 604800 });
}

export async function getPresignedUrlWithExpiry(
  key: string,
  expiresIn: number
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function extractS3Key(url: string): string | null {
  const patterns = [
    `https://${BUCKET}.s3.${REGION}.amazonaws.com/`,
    `https://${BUCKET}.s3.amazonaws.com/`,
  ];
  for (const prefix of patterns) {
    if (url.startsWith(prefix)) {
      return url.substring(prefix.length);
    }
  }
  return null;
}

export function isS3Url(url: string): boolean {
  return url.startsWith(`https://${BUCKET}.s3.`);
}

export async function listS3Objects(prefix: string): Promise<string[]> {
  const response = await s3Client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  return (response.Contents || []).map((obj) => obj.Key!);
}

export function generateS3Key(
  folder: string,
  originalName: string,
  suffix?: string
): string {
  const timestamp = Date.now();
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const ext = sanitized.split(".").pop();
  const base = sanitized.replace(/\.[^.]+$/, "");
  const uniqueSuffix = suffix ? `-${suffix}` : "";
  return `${folder}/${base}${uniqueSuffix}-${timestamp}.${ext}`;
}
