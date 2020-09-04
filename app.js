const express = require("express");
const app = express();
const port = 5000;

const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY, // aws access id here
  secretAccessKey: process.env.AWS_SECRET, // aws secret access key here
  sessionToken: process.env.AWS_SESSION_TOKEN,
  useAccelerateEndpoint: true,
  region: 'us-east-1',
});
const params = {
  Bucket: "images-to-process-mstokfisz",
  Key: '',
  Expires: 60*60, // expiry time 1h
  ACL: "private",
  ContentType: "image/jpeg", // accept any image
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// api endpoint to get signed url
app.post("/get-signed-url", (req, res) => {
  console.log(req);
  params.Key = req.body.filename;
  s3.getSignedUrl("putObject", params, function(err, url) {
    if (err) {
      console.log("Error getting presigned url from AWS S3");
      res.json({
        success: false,
        message: "Pre-Signed URL error",
        url: url
      });
    } else {
      console.log("Presigned URL: ", url);
      res.json({
        success: true,
        message: "AWS SDK S3 Pre-signed url generated successfully.",
        url: url
      });
    }
  });
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));