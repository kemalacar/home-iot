const express = require('express')
const path = require('path')
var WebSocket = require('ws');
var bodyParser = require('body-parser')
var mongodb = require("mongodb");
var moment = require('moment');
var request = require('request');


var mongoDbUser = "user";
var mongoDbPass = "pass"

var DHT11_TABLE = "DHT11_DATA";

var dht11 = {
    humidity: '',
    temperature: '',
    node: '',
    date: ''
};

const PORT = process.env.PORT || 5003


var localCache = {
    sessionId: ''
};


function home(req, res) {
    db.collection(DHT11_TABLE).find().toArray().then(function (numItems) {
        res.render('pages/index', {
            dht11: dht11,
            allInDb: numItems,
        });
    });
}

function set(req, res) {

    let body = req.body;
    let dt = new Date();


    dt.setHours(dt.getHours());

    let tmp = Object();

    tmp.humidity = body.humidity;
    tmp.temperature = body.temperature;
    tmp.temperature2 = body.temperature2;
    tmp.node = body.node;
    tmp.date = dt;

    // console.log(   tmp);
    // res.json({result: "ok"});

    let inserted = db.collection(DHT11_TABLE).insertOne(tmp).then(result => {
        res.json({result: result.insertedId});

        dht11.node = tmp.node;
        dht11.temperature = tmp.temperature;
        dht11.humidity = tmp.humidity;
        dht11.date = tmp.date;

        console.log("inserted.id=" + result.insertedId);

    }).catch(err => {

    });


}


function getAllByNode(req, res) {

    let date = new Date (req.body.date);
    date.setHours(0,0,0,0);
    let start = date;

    date = new Date (req.body.date);
    date.setHours(23,59,59,999);
    let end = date;

    db.collection(DHT11_TABLE).find({"node": req.body.node,"date": {$gte: start, $lt: end}}).sort( { date: 1 } ).toArray().then(function (numItems) {
        res.json(numItems);
    });

}

function getNodes(req, res) {
    var col = db.collection(DHT11_TABLE);
    let vsss = col.aggregate([
        {$match: {}}
        , {
            $group:
                {_id: "$node", count: {$sum: 1}}
        }
    ]).toArray(function (err, docs) {
        res.json(docs);
    });
}


function fromEsp(req,res){

    const body= req.body;
    console.log(body);
    if(body.ringing){
        sendPush("Ring Ring!!");

    }
    res.json({'result':'ok'});
}



function sendPush(msg){
    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url:     'https://api.pushed.co/1/push',
        body:    "app_key=**"+
        "&target_type=app&content="+msg
    }, function(error, response, body){
        // console.log(body);
    });
}

mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://" + mongoDbUser + ":" + mongoDbPass + "@**/kml",
    function (err, client) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        db = client.db();
        console.log("Database connection ready");
        setExpress();
    });
setExpress();
function setExpress() {

    express()
        .use(bodyParser.json())
        .use(express.static(path.join(__dirname, 'public')))
        .set('views', path.join(__dirname, 'views'))
        .set('view engine', 'ejs')
        .get('/', (req, res) => home(req, res))
        .post('/api/set', (req, res) => set(req, res))
        .post('/api/getall-by-node', (req, res) => getAllByNode(req, res))
        .get('/api/get-nodes', (req, res) => getNodes(req, res))
        .get('/api/from-esp', (req, res) => fromEsp(req, res))
        .post('/api/from-esp', (req, res) => fromEsp(req, res))
        .listen(PORT, () => console.log(`Listening on ${ PORT }`));
}


//========ALIVE SESSION