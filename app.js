require('dotenv').config();
const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const bodyParser = require("body-parser");
const {TimeoutError} = require('puppeteer/Errors');
const nodeMailer = require('nodemailer');
const path = require('path');
const EmailTemplate = require('email-templates');

const port= process.env.PORT|| 3000;
var app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
puppeteer.use(pluginStealth());

/* Email setup */
let transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAILID,
        pass: process.env.MAILPASSWORD
    }
});

let mailOptions = {
    from: `${process.env.MAILID}`, // sender address
    to: `${process.env.MAILTO}`, // list of receivers separated by comma
    subject: 'Price Alert!', // Subject line
    text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>', // html body
    dsn: {
        id: 'Message4MailPr1ce!1!', // is the envelope identifier that would be included in the response (ENVID)
        return: 'headers', //is either ‘headers’ or ‘full’. It specifies if only headers or the entire body of the message should be included in the response (RET)
        notify: 'success', //Possible values are ‘never’, ‘success’, ‘failure’ and ‘delay’.
        recipient: `${process.env.MAILID}`
    }
};

function sendPriceAlerts(url,date, time, price, screenshotName) {
    
    const templatePath = path.join(__dirname,"mailTemplates");   
    const screenshotPath = path.join(__dirname,"screenshots",screenshotName);    
    const email  = new EmailTemplate({
        transport: transporter,
        send: true,
        preview : false,
        views: {
            options : {
                extension : 'ejs',
            },
            root : templatePath,
        }
    });
    const cid =   `${Date.now()}`;
    console.log("cid",cid);
    let locals = {
        userName : process.env.MAILTOUSER || "",
        url : url,
        cid : cid,
        time : time,
        date : date,
        price: price,        
    };
    
    let attachments = [ {   filename: screenshotName,
                            path: screenshotPath,
                            contentType : 'image/png',
                            cid: cid
                        }
                    ];   
    mailOptions.attachments = attachments;                  
    email.send({
        template: 'showPrice',
        message : mailOptions,
        locals: locals,
    }).then(() => {console.log('email has been send!');logToFile("Mail is sent!!")})
      .catch(logToFile);            

}

function logToFile( message, file='server.log') {
    var now = new Date();   
    //var date = `${now.getDate()} -${now.getMonth()+1}-${now.getYear()}`;
    //var time = `${now.getHours()}:${now.getMinutes()}`;
    message =  `${now.toString()}=> ${message}`;
    fs.appendFile(file,message+'\n',(err)=>{
        if(err)
         {console.log(err);}
    });
}

async function run(url) {
   
    const browser =  await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true, slowMo:300});
    const interval = setInterval(async () => {
        console.log("interval called");
        const page = await browser.newPage();
        await page.setViewport({ width: 800, height: 600 });
        page.setDefaultTimeout(20000);
        await new Promise( async (resolve,reject) => { 
        try {       
                await page.goto(url,{waitUntil: 'load'}); //consider navigation to be finished when the load event is fired.
                let now = new Date();  
                let date = `${now.getDate()}-${now.getMonth()}-${now.getFullYear()}`;          
                let time = `${now.getHours()}hh ${now.getMinutes()}mm`;
                let selector = `.course-price-text > span + span > span`;
                let screenshotName = `price-${now.getDate()}-${time}.png`;
                try {
                    await page.screenshot({ path: `./screenshots/${screenshotName}`, fullPage: true });                    
                    try {
                        await page.waitFor(500);
                        await page.waitForSelector(selector,{timeout:5000});
                    } catch(e) {
                        if (e instanceof TimeoutError) {
                            await page.waitFor(2000);
                            await page.waitForSelector(selector,{timeout:4000});
                            }
                    }                
                } catch(err) {
                    console.log("error in taking screenshot.."+err);
                    logToFile("Screenshot Error: "+err);
                } finally {
                    logToFile("Screenshot taken");
                }

                try{
                    price = await page.$eval(selector, e => e.innerText);                        
                    console.log(`${date}, ${time}=>${price}`);
                } catch(err) {
                    await page.waitFor(1000);
                    price = await page.$eval(selector, e => e.innerText);  
                } finally {
                    logToFile(`Price is ${price}`);
                }                
                    
                sendPriceAlerts(url,date, time, price, screenshotName);       
                
            } catch(err){
                console.log(err);            
                page.close();           
            } finally {
                if(!page.isClosed()) {
                    page.close();
                }
            }     
        
    }); //new Promise ends  
        browser.close();
        
        res.render("index",{date,time,price});
    },3600000); //1hr
}

app.post("/pricing",(req,res)=> {
    var url = req.body.url;   
    if(!url){
        throw "Please provide URL";
    } else {
        console.log("url is "+url);
    }        
    try{            
        run(url);
      } catch(err){
          res.send("Taking much time!!"+err);
      } 
});

app.get("/",(req,res)=>{    
    res.render("index");
});

app.listen(port,"localhost",function(){
    console.log("Server has started ....");
});