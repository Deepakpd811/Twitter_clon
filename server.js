
const express = require('express')
const app = express();
const conn = require('./mysql.js')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const session = require('express-session')
var multer = require('multer');
var sendMail = require('./sendmail.js')


app.use(session({secret:"test123"}))
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine','ejs');

app.use(express.static(__dirname + "/public"));

// Optionally, serve files from the "public/uploads" directory
app.use('/uploads', express.static(__dirname + "/public/uploads"));

var storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/uploads/");
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now() +"-" +req.session.userid +"-"+ file.originalname);
    }
})


var uploads_detail = multer({
    storage:storage
})







app.get('/',(req,res)=>{
    var msg ="";
    if(req.session.msg !=""){
        msg = req.session.msg;
    }
    // req.session.msg = "";
    res.render('login.ejs',{msg:msg})
    
})
app.get('/home',(req,res)=>{
  
    if(req.session.userid != ""){
       let msg = "";

       if(req.session.msg != ""){
           msg = req.session.msg;
        }

        let sql = `select * from tweet inner join user on user.uid = tweet.uid where tweet.uid=? or tweet.uid  in (select follow_uid from user_following where uid=?) or tweet.content like '%${req.session.un}%' `;

        conn.query(sql,[req.session.userid,req.session.userid],(err,result,field)=>{
            if(err) throw err;
            // console.log(result)
           
            res.render("home",{result:result,msg:msg});
        })

       
        
    }
    
    

    
    
    else{
        
        req.session.msg ="plese login first to view home page";
        res.redirect('/')
    }
})

app.get('/signup',(req,res)=>{

    res.render('signup.ejs',{msg:" "})
})

app.get('/logout',(req,res)=>{
    req.session.userid = "";
    res.redirect('/');
})

app.get('/editprofile',(req,res)=>{
    let sql = "select * from user where uid=?";

    conn.query(sql,[req.session.userid],(err,result,field)=>{
        if(err) throw err;

        res.render('editprofile.ejs',{msg:"",result:result})
    })

})


app.get('/followers',(req,res)=>{
    let sql = `SELECT * FROM user WHERE uid IN (SELECT uid FROM user_following WHERE follow_uid = ?)`;
    

    conn.query(sql,[req.session.userid],(err,result,field)=>{
        if(err) throw err;
        res.render('follower.ejs', {result:result, msg:""})
    })
})

app.get('/following',(req,res)=>{
    let sql = `SELECT * FROM user WHERE uid IN (SELECT follow_uid FROM user_following WHERE uid = ?)`;
    

    conn.query(sql,[req.session.userid],(err,result,field)=>{
        if(err) throw err;
        res.render('following.ejs', {result:result, msg:""})
    })
})

app.get('/showtweet',(req,res)=>{
    let sql = `SELECT content FROM tweet where uid =?`;
    

    conn.query(sql,[req.session.userid],(err,result,field)=>{
        if(err) throw err;
        res.render('showtweet.ejs', {result:result, msg:""})
    })
})

app.post('/tweetsubmit',uploads_detail.single('tweet_img'),(req,res)=>{
    const {post} = req.body;

    console.log(req.file);
    console.log(req.file.filename);
    let filename = req.file.filename;
    let minitype = req.file.mimetype;

    var d = new Date();
    var m = d.getMonth() +1 ;
    var dt = d.getFullYear() + "-" + m + "-" + d.getDate()+" "+ d.getHours() + ":" + d.getMinutes()+":"+d.getSeconds();

    let sql = `insert into tweet (uid,content,datetime,image_vdo_name,type) values (?,?,?,?,?)`;

    conn.query(sql,[req.session.userid,post,dt,filename,minitype],(err,result,field)=>{
        if(err) throw err;
        if(result.insertId>0){
            req.session.msg = "tweet done"
        }else{
            req.session.msg = "can not tweet post"

        }
        res.redirect('/home');
    })



})

app.post('/edit_profile_submit' ,(req,res)=>{
    const {fname,mname,lname,about} = req.body;
    let sqlupdate = `update user set fname=?, mname=?,  lname=?, about=? where uid =? `;

    conn.query(sqlupdate,[fname,mname,lname,about,req.session.userid],(err,result,data)=>{
      if(err) throw err;
        if(result.affectedRows==1){
            req.session.msg = "data updated";
            res.redirect('/home');
        }else{
            req.session.msg = "can not data updated";
            res.redirect('/home');

        }
    })

})

app.post('/login_submit',(req,res)=>{
    const {email,pass} = req.body;
    let sql ="";
    if(isNaN(email)){
        sql = `select * from user where email = "${email}"
         and password="${pass}" and status =1 and softdelete =0`
    }else{
        sql = `select * from user where mobile = ${email} 
        and password="${pass}" and status =1 and softdelete =0`
    }

    conn.query(sql,(err,result,fields)=>{
        if(err) throw err;

        if(result.length ==0){
            res.render('login',{msg:"bad credential"})
        }else{
            req.session.userid = result[0].uid;
            req.session.un = result[0].username;
            res.redirect('/home');
        }

    })
})

app.post('/signup',(req,res)=>{
    const { fname, mname, lname, emailphone, password, cpassword, dob, gender } = req.body;
    let check_sql ="";
    if(isNaN(emailphone)){
        check_sql = `select * from user where email = "${emailphone}"`;
    }else{
        check_sql = `select * from user where mobile = ${emailphone}`;
    }

    conn.query(check_sql,(err,result,field)=>{
        if(err) throw err;

        if(result.length ==1){
            if(isNaN(emailphone)){
                msg = "email is already existed"
            }else{
                msg = "Number is existed"
            }
            res.render('signup',{msg:msg});
        }else {
            let curdate = new Date();
            let month = curdate.getMonth() + 1;
            let dor = curdate.getFullYear() + "-" + month +"-"+ curdate.getDate();
            let sql = "";
            let rn = Math.floor(Math.random()*999)
            let username = fname+ rn;
            if (isNaN(emailphone)) {
                sql = "insert into user(fname,mname,lname , email, password,DOB,DOR,Gender,status,username) values(?,?,?,?,?,?,?,?,?,?)";
            } else {
                sql = "insert into user(fname,mname,lname , mobile, password,DOB,DOR,Gender,status,usernmae) values(?,?,?,?,?,?,?,?,?,?)";
            }
            conn.query(sql, [fname, mname, lname, emailphone, password, dob, dor, gender,0,username], function (err, result, fields) {
                if (err) {
                    console.error(err);
                    res.render('signup', { errmsg: "unable to register try again" });
                } else {
                    if (result && result.insertId > 0) {
                        if(isNaN(emailphone)){
                            sendMail(emailphone)
                        }
                        req.session.msg = "your account is created email or mobile for verification code";
                        res.redirect('/');
                    } else {
                        res.render('signup', { errmsg: "unable to register try again" });
                    }
                }
            });
        }
    })

    
    
})

app.get('/verifyemail', (req, res) => {
    const email = req.query.email; // Extract the email from the query parameters
    let sql_update = "update user set status=1 where email=?";

    conn.query(sql_update,[email],(err,result,field)=>{
        if(err) throw err;
        if(result.affectedRows ==1){
            req.session.msg = "email varified for login visit home page"
            res.redirect('/');
        }else{
            req.session.msg = "cant email varified signup again"
            res.redirect('/');

        }
    })
});




app.listen(8080,()=>{
    console.log("server running");
})









