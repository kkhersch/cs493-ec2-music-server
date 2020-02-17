const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
AWS.config.region = 'us-east-1';

const s3 = new AWS.S3();

const PORT = 1337;
const BUCKET = 'cs493-aws-music-app'

app.get('/', function (req, res) {
  res.send('cs493 cloud dev music app for 24/7 lofi hip hop music to study and relax');
});

var insert_song = function(song_obj, song_name, song_url) {
	song_obj[song_name] = song_url
}

var song_obj = {}

app.get('/songs', function(req, res) {
	console.log("someone requested songs: ")
	let params = {
		Bucket: BUCKET,
	}

	s3.listObjectsV2(params, function(s3err, data) {
		if(s3err) {throw s3err}
		else {
			//console.log(`data returned: ${JSON.stringify(data, null, 2)}`)

			data.Contents.forEach(content => {
				//console.log("href: " + this.request.httpRequest.endpoint.href);
				//song url is made up of the s3 url, the bucket, and the key of the s3 data object returned
				let song_url = this.request.httpRequest.endpoint.href + BUCKET + '/' + encodeURIComponent(content.Key)
				//console.log("song url: " + song_url)
				let song_name = content.Key.split("/").pop();
				insert_song(song_obj, song_name, song_url)
			})
		}
	//console.log(`song object has: \n${JSON.stringify(song_obj, null, 2)}`)
	res.send(song_obj);
	});
});


app.listen(PORT);

console.log(`listening on port: ${PORT}`);
