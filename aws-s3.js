const fs = require('fs');
const path = require('path')
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    region: 'us-west-2',
    // accessKeyId: 'AKIATPTD3BHFJYIES7EC',
    // secretAccessKey: '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'
});

var myBucket = 'roar-app-assets';




exports.uploadFile = function (file, key) {
    return new Promise(function (resolve, reject) {
        fs.readFile(file.path, function (err, data) {
            if (err) {
                throw err;
            }
            console.log("data", data)
            params = { Bucket: myBucket, Key: key, Body: data, ACL: 'public-read', ContentType: file.mimetype };
            s3.putObject(params, function (err, data) {
                if (err) {
                    reject(err);
                    console.log(err)
                } else {
                    resolve(key);
                    console.log("Successfully uploaded data to myBucket/myKey" + data);
                }
            });
        });
    })
}



exports.uploadFiles = function (files, prefix) {
    return new Promise(function (resolve, reject) {
        var s3KeyArr = [];
        for (var i = 0; i < files.length; i++) {
            const file = files[i];
            let fileExt = path.extname(file.originalname);
            let myKey = prefix + file.filename + fileExt;
            fs.readFile(file.path, function (err, data) {
                if (err) {
                    throw err;
                }
                params = { Bucket: myBucket, Key: myKey, Body: data, ACL: 'public-read', ContentType: file.mimetype };
                s3.putObject(params, function (err, data) {
                    // console.log("====>" ,data)
                    if (err) {
                        reject(err);
                        //console.log(err)
                    } else {
                        s3KeyArr.push({ "s3key": myKey });
                        fs.unlinkSync(file.path);

                        if (s3KeyArr.length === files.length) {
                            resolve(s3KeyArr);
                        }
                    }
                });
            });
        }
    });
}

