const s3Access = require('./s3_access'); // Assuming the file is in the same directory

async function create_buckets() {
    try {
        const bucketName = 'profile_photos';
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
}

create_buckets();
