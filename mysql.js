
const mysql = require('mysql')

const conn = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"admin",
    database:"tweet_database"
})

conn.connect((err)=>{
    if(err) throw err;
    console.log("connection done")
})


module.exports = conn;

