//server.js by Cody Spring

let express = require('express')
let exphbs = require('express-handlebars')

let bodyParser = require('body-parser')
const { request } = require('http')
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;

const url = "mongodb+srv://cjspring:HbbNV7vf8f5Ury26@cluster0.qnz1h.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

let app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({defaultLayout: null}))
app.set('view engine', 'handlebars')

let port = 1337

function refresh(){
MongoClient.connect(url,{useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("scores");
    dbo.collection("playerScores").find({}).toArray( function(err, result) {
      if (err) throw err;
      const jsonString = JSON.stringify(result)
      fs.writeFileSync('./scores.json', jsonString)
      db.close();
    });
  });  
}

app.post('/insert', function(req,res,next){
  let item = {
    Name: req.body.Name,
    Score: req.body.Score
  };
    MongoClient.connect(url,{useNewUrlParser: true, useUnifiedTopology: true}, function(err, db){
      let dbo = db.db("scores");
      dbo.collection('playerScores').insertOne(item, function (err, result) {
        console.log('item has been inserted');
        db.close;
    });
  });
  refresh();
})

refresh();

app.use(express.static('public'));

app.get('/scores.json', function(req, res) {
    delete require.cache[require.resolve('./scores.json')]
    refresh();
    res.status(200).sendFile(__dirname + '/scores.json')
})

app.get('/leaderboard', function(req, res, next) {
  delete require.cache[require.resolve('./scores.json')]
  refresh();
  let scoresDB = require('./scores.json')
  scoresDB.sort(function(a,b){
    return b.Score - a.Score;
  })
  res.status(200).render('leaderboardview', {scores: scoresDB})
})

app.get('*', function(req, res, next) {
    console.log("404 not found")
    res.status(404).sendFile(__dirname + '/public/404.html')
})

var favicon = require('serve-favicon');

app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.listen(port, function() {
    console.log("Server Is Running on port:", port)
})