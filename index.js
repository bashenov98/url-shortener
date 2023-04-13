require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const shortId = require('shortid');
const validUrl = require('valid-url');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});

const URL = mongoose.model("URL", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function (req, res) {
  const url = req.body.url_input;
  
  const urlCode = shortId.generate();

  if (!validUrl.isUri(url)) {
    res.status(401).json({error: 'invalid url'});
  } 
  else {
    try {
      let findOne = await URL.findOne({
        original_url: url, 
        short_url: urlCode
      });
      if (findOne) {
        res.json({original_url: findOne.original_url, short_url: findOne.short_url});
      }
      else {
        findOne = new URL({original_url: url, short_url: urlCode});
        
        await findOne.save();
        res.json({original_url: findOne.original_url, short_url: findOne.short_url});
      }
    }
    catch (err) {
      console.log(err);
      res.status(500).json('Internal error');
    }
  }
});

app.get('/api/shorturl/:short_url?', async function (req, res) {
  try {
    const urlParams = await URL.findOne({short_url: req.params.short_url});
    if (urlParams) {
      return res.redirect(urlParams.original_url);
    }
    else {
      return res.status(404).json('URL not found');
    }
  }
  catch (err) {
    console.log(err);
    res.status(500).json('Internal error');
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
