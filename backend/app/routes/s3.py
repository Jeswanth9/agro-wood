from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from app.auth_helper import verify_jwt_token

import boto3
from botocore.exceptions import BotoCoreError, ClientError
import uuid
import os

router = APIRouter()

AWS_REGION = "us-east-1"
S3_BUCKET_NAME = "agro-wood-bucket"
S3_UPLOAD_FOLDER = "product-images"
SIGNED_URL_EXPIRATION = 3600

def generate_signed_url(s3_key: str):
    if not s3_key:
        return None
    s3_client = boto3.client("s3", region_name=AWS_REGION)
    try:
        signed_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=SIGNED_URL_EXPIRATION
        )
        return signed_url
    except Exception:
        return None


@router.post("/upload-file")
async def upload_file_to_s3(
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_jwt_token)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    s3_key = f"{S3_UPLOAD_FOLDER}/{unique_filename}"

    s3_client = boto3.client("s3", region_name=AWS_REGION)

    try:
        file_content = await file.read()
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type,
        )
        signed_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=SIGNED_URL_EXPIRATION
        )
        return {
            "file_key": s3_key,
            "signed_url": signed_url,
            "expires_in": SIGNED_URL_EXPIRATION
        }

    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
