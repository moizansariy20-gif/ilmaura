
// backblaze.config.ts
// IMPORTANT: YOU MUST REPLACE THESE VALUES WITH YOUR REAL BACKBLAZE KEYS
// 1. Go to Backblaze B2 Console -> App Keys -> Add New Application Key
// 2. Go to Buckets -> CORS Rules -> Enable "Share everything in this bucket with all HTTPS origins"

export const backblazeConfig = {
  // Your Bucket Name (e.g., edusmart-files)
  bucketName: 'ayazansari12345',
  
  // Your Region Endpoint (e.g., s3.us-west-002.backblazeb2.com)
  // You can find this on the "Buckets" page in Backblaze
  // NOTE: Must include 'https://' prefix
  endpoint: 'https://s3.us-west-004.backblazeb2.com',
  
  // Your Region (e.g., us-west-002)
  region: 'us-west-004', 
  
  // Your Application Key ID (from App Keys page)
  accessKeyId: '004593258ab2baa0000000001',
  
  // Your Application Key (from App Keys page - only shown once!)
  secretAccessKey: 'K004OpcCkojcUnanBWxhzM1GjwwAOkI' 
};
