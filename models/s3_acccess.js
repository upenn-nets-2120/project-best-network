const { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-provider-ini');
const process = require('process');
const config = require('../config.json'); // Load configuration

let s3Client = null;

module.exports = {
    get_s3_client,
    close_s3_client,
    create_bucket,
    upload_photo,
    get_photo,
    delete_photo
};

function close_s3_client() {
    if (s3Client) {
        s3Client = null;
    }
}

async function get_s3_client() {
    if (!s3Client) {
        const awsCredentials = fromIni({
            profile: config.awsProfile,
            credentialsFile: config.awsCredentialsFile
        });
        s3Client = new S3Client({
            region: config.awsRegion,
            credentials: awsCredentials
        });
    }
    return s3Client;
}

async function create_bucket(bucketName) {
    const s3 = await get_s3_client();

    const createBucketParams = { Bucket: bucketName };

    try {
        const data = await s3.send(new CreateBucketCommand(createBucketParams));
        console.log('Bucket created:', data.Location);
        return true;
    } catch (err) {
        console.error('Error creating bucket:', err);
        return false;
    }
}

async function upload_photo(bucketName, objectKey, fileContent, contentType) {
    const s3 = await get_s3_client();

    const uploadParams = {
        Bucket: bucketName,
        Key: objectKey,
        Body: fileContent,
        ContentType: contentType
    };

    try {
        const data = await s3.send(new PutObjectCommand(uploadParams));
        console.log('Photo uploaded:', data.Location);
        return true;
    } catch (err) {
        console.error('Error uploading photo:', err);
        return false;
    }
}

async function get_photo(bucketName, objectKey) {
    const s3 = await get_s3_client();

    const getParams = {
        Bucket: bucketName,
        Key: objectKey
    };

    try {
        const data = await s3.send(new GetObjectCommand(getParams));
        return data.Body;
    } catch (err) {
        console.error('Error getting photo:', err);
        return null;
    }
}

async function delete_photo(bucketName, objectKey) {
    const s3 = await get_s3_client();

    const deleteParams = {
        Bucket: bucketName,
        Key: objectKey
    };

    try {
        const data = await s3.send(new DeleteObjectCommand(deleteParams));
        console.log('Photo deleted:', data.Deleted);
        return true;
    } catch (err) {
        console.error('Error deleting photo:', err);
        return false;
    }
}
