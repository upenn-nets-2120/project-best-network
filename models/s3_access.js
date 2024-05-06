const { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand,  ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-provider-ini');
const process = require('process');
const config = require('../config.json'); // Load configuration

let s3Client = null;

module.exports = {
    get_s3_client,
    close_s3_client,
    create_bucket,
    put_by_key,
    get_by_key,
    delete_by_key,
    list_objects
};

function close_s3_client() {
    if (s3Client) {
        s3Client = null;
    }
}



async function get_s3_client() {
    if (!s3Client) {
        const awsCredentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken : process.env.AUTH_TOKEN
        };
        s3Client = new S3Client({
            region: 'us-east-1',
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

async function put_by_key(bucketName, objectKey, fileContent, contentType) {
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

async function get_by_key(bucketName, objectKey) {
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

async function delete_by_key(bucketName, objectKey) {
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

async function list_objects(bucketName, prefix = '') {
    const s3 = await get_s3_client();

    const listParams = {
        Bucket: bucketName,
        Prefix: prefix
    };

    try {
        const data = await s3.send(new ListObjectsV2Command(listParams));
        return data.Contents;
    } catch (err) {
        console.error('Error listing objects:', err);
        return null;
    }
}
