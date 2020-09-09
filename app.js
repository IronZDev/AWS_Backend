const express = require("express");
const app = express();
const port = 5000;
const mime = require('mime-types')

const AWS = require("aws-sdk");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY, // aws access id here
  secretAccessKey: process.env.AWS_SECRET, // aws secret access key here
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'us-east-1',
  signatureVersion: 'v4',
});
// api endpoint to get signed url

app.post('/signed-form-upload', async (req, res) => {
  const options = {
    signatureVersion: 'v4',
    region: 'us-east-1', // same as your bucket
    endpoint: new AWS.Endpoint('https://images-to-process-mstokfisz.s3.amazonaws.com'),
    useAccelerateEndpoint: false,
    s3ForcePathStyle: true,  }

  const client = new AWS.S3(options);
  console.log("Creating signature for: " + req.body.filename + "... ");
  const key = new Date().toISOString() + "/" + req.body.filename;

  const params = {
    Bucket: 'images-to-process-mstokfisz',
    Key: key,
    Fields: {
      Key: key,
      'success_action_status': '201',
      'Content-Type': mime.lookup(req.body.filename),
      'X-Amz-Meta-Filename': req.body.filename
    },
  };
  const form = await (new Promise((resolve, reject) => {
    client.createPresignedPost(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    });
  }));
  console.log('Done!');
  return { ...res.json(form), url: options.endpoint.host }
});

async function getAllImagesFromBucket(bucketName) {
  const options = {
    region: 'us-east-1', // same as your bucket
  }

  const client = new AWS.S3(options);
  /* TO DO: Handle continuation token, for now grabbing only first 1000 */
  const files = await (new Promise((resolve, reject) => {
    client.listObjectsV2({Bucket: bucketName}, (err, data) => {
      if(err) {
        reject(err)
      } else {
        resolve(data)
      }
    });
  }));
  console.log(files);
  const fileKeys = files.Contents.map(file => file.Key);
  console.log(fileKeys);
  const response = [];
  for (let key of fileKeys) {
    const url = client.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: 600 // 10 min
    });
    const filename = key.split('/').slice(-1)[0];
    response.push({ key, url, filename });
  }
  return response;
}

app.get('/get-images', async (req, res) => {
  const imageList = await getAllImagesFromBucket('images-to-process-mstokfisz');
  return res.json(imageList);
});

app.get('/get-transformed-images', async (req, res) => {
  const imageList = await getAllImagesFromBucket('transformed-images-mstokfisz');
  return res.json(imageList);
});

app.post('/send-sqs-message', async (req, res) => {
  const SQS = new AWS.SQS();
  SQS.sendMessage({
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/575075258561/images-queue',
    MessageBody: JSON.stringify({
      key: req.body.key,
      rotation: req.body.rotation
    })
  }, (err, data) => {
    if (err) {
      return err;
    } else {
      console.log(data);
    }
  });
  return 'Message sent!';
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));