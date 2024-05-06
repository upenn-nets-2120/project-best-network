const s3Access = require('./s3_access'); 
const config = require('../config.json');

async function create_buckets() {
    try {
        const bucketName = config.s3.bucketName;
        const acl = 'public'; // You can set ACL to 'public-read' or other options
        const result = await s3Access.create_bucket(bucketName, acl);
        if (result) {
            console.log('Bucket created successfully:', bucketName);
        } else {
            console.log('Failed to create bucket:', bucketName);
        }
    } catch (err) {
        console.error('Error creating bucket:', err);
    }
    s3Access.close_s3_client()
}

create_buckets();
