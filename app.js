require('dotenv').config();
const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const bodyParser = require("body-parser");
const {TimeoutError} = require('puppeteer/Errors');
const nodeMailer = require('nodemailer');

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
    from: `Devendra" <${process.env.MAILID}>`, // sender address
    to: `process.env.MAILTO`, // list of receivers separated by comma
    subject: 'Price Alert!', // Subject line
    text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>' // html body
};

function sendPriceAlerts(txtMsg,htmlMsg) {
    mailOptions.text = txtMsg;
    mailOptions.html = htmlMsg;
    try {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(400).send({success: false})
            } else {
                res.status(200).send({success: true});
            }
        });
    } catch(err) {
        logToFile("Email not sent");
    }
    
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

app.get("/pricing",(req,res)=> {
    let date, time, price;
    const url = 'https://www.udemy.com/the-web-developer-bootcamp/';
    puppeteer.launch({ headless: true }).then(async browser => {
        const page = await browser.newPage();
        await page.setViewport({ width: 800, height: 600 });
        await page.goto(url, { timeout: 120000, waitUntil: 'networkidle0' })
            .catch(e => {
              console.log('Oops! some error occured');
            browser.close();
        });    
        
        await page.waitFor(5000)
        //await page.screenshot({ path: 'testresult.png', fullPage: true })
        await page.waitForSelector('.course-price-text > span + span > span');
        const now= new Date();
        try{
            price = await page.$eval('.course-price-text > span + span > span', e => e.innerText);
        }catch(err) {
            console.log("taking lots of time");
        }
        
        console.log(price);
        await browser.close();                 
        date = `${now.getDate()}-${now.getMonth()+1}-${now.getYear()}`;
        time = `${now.getHours()}:${now.getMinutes()}`;
        let log = `${date} at ${time}, Price is ${price}`;
        console.log(log);
        fs.appendFile('server.log',log+'\n',(err)=>{
            if(err)
                {console.log(err);}
        });
        
      });
    res.render("display",{date,time,price});
});


async function check(url) {
    process.on("uncaughtException", (e) => {
        console.error("Unhandled exeption:", e);
        process.exit(6);
        });
        process.on("unhandledRejection", (reason, p) => {
        console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
        // application specific logging, throwing an error, or other logic here
        // cont = false;
        });  
    const browser = await puppeteer.launch({ headless: true,ignoreHTTPSErrors: true, slowMo:800 });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await new Promise( async (resolve,reject) => { 
    try { 
            await page.goto(url,{waitUntil: 'domcontentloaded'});
            let now = new Date();  
            let date = `${now.getDate()} -${now.getMonth()+1}-${now.getYear()}`;          
            let time = `${now.getHours()}hh ${now.getMinutes()}mm`;
            try {
                await page.screenshot({ path: `./screenshots/price-${now.getDate()}-${time}.png`, fullPage: true });
                
            } catch(err){
                console.log("error in screenshot.."+err);
                logToFile("Error: "+err);
            }
           console.log("After screenshot");
           // await Promise.race([page.screenshot({ path: `./screenshots/price-${now.getDate()}-${time}.png`, fullPage: true }), 
          // new Promise((resolve, reject) => setTimeout(reject, 2000))]);
            try {
                await page.waitFor(500);
                await page.waitForSelector('.course-price-text > span + span > span',{timeout:5000});
            } catch(e) {
                if (e instanceof TimeoutError) {
                    await page.waitFor(1000);
                    await page.waitForSelector('.course-price-text > span + span > span',{timeout:4000});
                    }
            }        
            
            price = await page.$eval('.course-price-text > span + span > span', e => e.innerText);                        
            console.log(`${date}, ${time}=>${price}`);
            
            let htmlMsg = `The price for the <a href="${url}'">course</a> at ${now} is ${price} ` ;
            sendPriceAlerts(htmlMsg);
           
            logToFile(`Price: ${price}`);
        } catch(err){
            console.log(err);            
            browser.close();           
        }
                
    }); //new Promise ends   
    browser.close();
    
    res.render("index",{date,time,price});
}

app.post("/pricing",(req,res)=>{
    var url = req.body.url;
    let date, time, price;
    if(!url){
        throw "Please provide URL";
    } else {
        console.log("url is "+url);
    }    

    /* puppeteer.launch({ headless: true }).then(async browser => {
        const page = await browser.newPage();
        await page.setViewport({ width: 800, height: 600 });
        await page.goto(url, { timeout: 120000, waitUntil: 'networkidle0' })
            .catch(e => {
              console.log('Oops! some error occured');
            browser.close();
        });    
        
        await page.waitFor(5000)
        //await page.screenshot({ path: 'testresult.png', fullPage: true })
        await page.waitForSelector('.course-price-text > span + span > span');
        
        const now= new Date();
        price = await page.$eval('.course-price-text > span + span > span', e => e.innerText);
        console.log(price);
        await browser.close();                 
        date = `${now.getDate()}-${now.getMonth()+1}-${now.getYear()}`;
        time = `${now.getHours()}:${now.getMinutes()}`;
        let log = `${date} at ${time}, Price is ${price}`;
        console.log(log);
        fs.appendFile('server.log',log+'\n',(err)=>{
            if(err)
                {console.log(err);}
        });
        
      }); */
      try{
            const interval = setInterval(async () => {
            check(url);
        },120000); //2 min
      } catch{
          res.send("Taking much time!!");
      }
      
    //res.send("posting "+url+ "price: "+price);
});

app.get("/",(req,res)=>{    
    res.render("index");
});

app.listen(port,"localhost",function(){
    console.log("Server has started ....");
});