const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const {parse, stringify} = require('flatted/cjs');
const redis = require('redis');

const publisher = redis.createClient({
	host: "cs493-reporter.klyav9.ng.0001.use1.cache.amazonaws.com",
	port: 6379
})

const app = express();
app.use(express.json());

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.use(cors());
AWS.config.region = 'us-east-1';

const s3 = new AWS.S3();

const PORT = 1337;
const BUCKET = 'cs493-aws-music-app'
const dynamodb = new AWS.DynamoDB();
const ddbClient = new AWS.DynamoDB.DocumentClient();
const ddb_table_name = "music"

app.post('/play', function(req, res) {
	let body = req.body
	console.log(jsonString(body))
	publisher.publish("songIsPlaying", body.songData.join(' '));

})

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

//by specific song
app.get('/song', function(req, res) {
	console.log("params: "+ jsonString(req.query))

	let params = {
		ExpressionAttributeValues: {
		 ":s": {
			 S: req.query.song
			}
		}, 
		KeyConditionExpression: "pk = :s",
		TableName: ddb_table_name
	 };
	dynamodb.query(params, function(ddb_err, data) {
		if(ddb_err) {throw ddb_err}
		else {
			console.log("returned ddb: " + jsonString(data))
			res.send(data.Items[0].sk.S)
		}
	})
})

//songs by album
app.get('/songs/for/album', function(req, res) {
	console.log("params: "+ jsonString(req.query))
	let params = {
		ExpressionAttributeValues: {
		 ":album": {
			 S: req.query.album
			}
		}, 
		KeyConditionExpression: "pk = :album",
		TableName: ddb_table_name
	 };
	dynamodb.query(params, function(ddb_err, data) {
		if(ddb_err) {throw ddb_err}
		else {
			console.log("returned ddb: " + jsonString(data))
			let songs = []
			data.Items.forEach((song) => {
				songs.push(song.sk.S)
			})
			res.send(songs)
		}
	})
})

//albums by artist
app.get('/albums/for/artist', function(req, res) {
	console.log("params: "+ jsonString(req.query))
	let params = {
		ExpressionAttributeValues: {
		 ":artist": {
			 S: req.query.artist
			}
		}, 
		KeyConditionExpression: "pk = :artist",
		TableName: ddb_table_name
	 };
	dynamodb.query(params, function(ddb_err, data) {
		if(ddb_err) {throw ddb_err}
		else {
			console.log("returned ddb: " + jsonString(data))
			let albums = []
			data.Items.forEach((album) => {
				albums.push(album.sk.S)
			})
			res.send(albums)
		}
	})
})

//artists by genre
app.get('/artists/for/genre', function(req, res) {
	console.log("params: "+ jsonString(req.query))
	let params = {
		ExpressionAttributeValues: {
		 ":genre": {
			 S: req.query.genre
			}
		}, 
		KeyConditionExpression: "pk = :genre",
		TableName: ddb_table_name
	 };
	dynamodb.query(params, function(ddb_err, data) {
		if(ddb_err) {throw ddb_err}
		else {
			console.log("returned ddb: " + jsonString(data))
			let artists = []
			data.Items.forEach((artist) => {
				artists.push(artist.sk.S)
			})
			res.send(artists)
		}
	})
})

//get all genres
app.get('/genres', function(req, res) {
	let params = {
		ExpressionAttributeValues: {
		 ":genre": {
			 S: "genre"
			}
		}, 
		KeyConditionExpression: "pk = :genre",
		TableName: ddb_table_name
	 };
	dynamodb.query(params, function(ddb_err, data) {
		if(ddb_err) {throw ddb_err}
		else {
			console.log("returned ddb: " + jsonString(data.Items[0]))
			resData = {
				dataType: "genre",
				genres: data.Items[0].genre["SS"]
			}
			console.log("resData: " + JSON.stringify(resData, null, 2));
			res.send(resData)
		}
	})
})

var jsonString = function (obj) {
	return JSON.stringify(obj, null, 2)
}
app.listen(PORT);

console.log(`listening on port: ${PORT}`);
