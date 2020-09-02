const express = require("express");
const app = express();
const port = 5000;

const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: "ASIA4V76QNYSIUIOK4WH", // aws access id here
  secretAccessKey: process.env.AWS_SECRET, // aws secret access key here
  useAccelerateEndpoint: true
});
const params = {
  Bucket: "mstokfisz-to-process",
  Key: "ASIA4V76QNYSIUIOK4WH",
  Expires: 60*60, // expiry time
  ACL: "bucket-owner-full-control",
  ContentType: "image/jpeg" // this can be changed as per the file type
};

// api endpoint to get signed url
app.get("/get-signed-url", (req, res) => {
  const fileurls = [];
  s3.getSignedUrl("putObject", params, function(err, url) {
    if (err) {
      console.log("Error getting presigned url from AWS S3");
      res.json({
        success: false,
        message: "Pre-Signed URL error",
        urls: fileurls
      });
    } else {
      fileurls[0] = url;
      console.log("Presigned URL: ", fileurls[0]);
      res.json({
        success: true,
        message: "AWS SDK S3 Pre-signed urls generated successfully.",
        urls: fileurls
      });
    }
  });
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));