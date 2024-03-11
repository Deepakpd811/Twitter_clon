

const nodemailer = require('nodemailer');

async function sendVerifyMail(to_email){



let transporter = nodemailer.createTransport({
    service:"gmail",
    port:"465",
    auth:{
        user:"deepak0413.be21@chitkara.edu.in",
        pass:"ccfw nkyx ckzd aiyl"
    }
})

let info = transporter.sendMail({
    to:to_email,
    from:"deepak0413.be21@chitkara.edu.in",
    subject:"Verify email for tweeter clon",
    html:`<h1>Please click on link to varify email id </h1>
            <a href="http://localhost:8080/verifyemail?email=${to_email}"> click here to varify email </a>`
})

if( info.messageId){
    return true;
}else{
    return false;
}

}

module.exports = sendVerifyMail;




