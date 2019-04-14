var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');

var app = express();

app.set('port', process.env.PORT || 5000);

app.use(express.static('public'));
app.use(bodyParser.json());

var minutes = 0.5;
var the_interval = minutes * 60 * 1000;
setInterval(function() {
    pg.connect(process.env.DATABASE_URL+'?ssl=true', function(err, client, done) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        client.query(
            'SELECT *'+
            'FROM salesforce.presenter__c ', 
        function(err, result) {
            if (err) {
                console.error(err);
            } else {
                var contacts = {};
                result.rows.forEach(function(row){
                    console.log("Name: "+row.name);
                    console.log("Topic: "+row.topic__c);
                    console.log("\n");
                });
            }
        })
    });
}, the_interval);

app.post('/update', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function (err, conn, done) {
        // watch for any connect issues
        if (err) console.log(err);
        conn.query(
            'UPDATE salesforce.presenter__c SET topic__c = $1 WHERE LOWER(Name) = LOWER($2)',
            [req.body.topic.trim(), req.body.firstName.trim()],
            function(err, result) {
                if (err != null || result.rowCount == 0) {
                  conn.query('INSERT INTO salesforce.presenter__c (topic__c, name) VALUES ($1, $2)',
                  [req.body.topic.trim(), req.body.firstName.trim()],
                  function(err, result) {
                    done();
                    if (err) {
                        res.status(400).json({error: err.message});
                    }
                    else {
                        // this will still cause jquery to display 'Record updated!'
                        // eventhough it was inserted
                        res.json(result);
                    }
                  });
                }
                else {
                    done();
                    res.json(result);
                }
            }
        );
    });
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
