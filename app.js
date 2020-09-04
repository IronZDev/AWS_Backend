const express = require("express");
const app = express();
const port = 5000;

const AWS = require("aws-sdk");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// api endpoint to get signed url

app.post('/signed-form-upload', async (req, res) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY, // aws access id here
    secretAccessKey: process.env.AWS_SECRET, // aws secret access key here
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1',
    signatureVersion: 'v4',
  });
  const params = {
    Bucket: 'images-to-process-mstokfisz',
    Key: req.body.filename,
    Fields: {
      Key: req.body.filename,
      'X-Amz-Meta-Rotation': '1',
      'success_action_status': '201'
    },
  };
  const options = {
    signatureVersion: 'v4',
    region: 'us-east-1', // same as your bucket
    endpoint: new AWS.Endpoint('https://images-to-process-mstokfisz.s3.amazonaws.com'),
    useAccelerateEndpoint: false,
    s3ForcePathStyle: true,  }

  const client = new AWS.S3(options);
  const form = await (new Promise((resolve, reject) => {

    client.createPresignedPost(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    });
  }));
  return { ...res.json(form), url: options.endpoint.host }
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));