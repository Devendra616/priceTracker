const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const bodyParser = require("body-parser");

const port= process.env.PORT|| 3000;

var app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use((req,res,next)=>{
    var now= new Date();
    var log = `${now.toString()}: ${req.method} ${req.url}`;
    var date = `${now.getDate()} -${now.getMonth()+1}-${now.getYear()}`;
    var time = `${now.getHours()}:${now.getMinutes()}`;
    console.log(log);
    fs.appendFile('server.log',log+'\n',(err)=>{
        if(err)
            {console.log(err);}
    });
    next();
});

puppeteer.use(pluginStealth());

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

app.post("/pricing",(req,res)=>{
    var url = req.body.url;
    let date, time, price;
    if(!url){
        throw "Please provide URL";
    }

    async function check() {
        const browser = await puppeteer.launch({ headless: true, slowMo:500 });
        const page = await browser.newPage();
        await page.setViewport({ width: 800, height: 600 });
        await page.evaluate( async ()=>{
            await new Promise((resolve,reject) => {
                try{
                    const interval = setInterval(async ()=> {
                        await page.goto(url);
                        await page.waitFor(5000);
                        await page.waitForSelector('.course-price-text > span + span > span');
                        const now= new Date();
                        date = `${now.getDate()}-${now.getMonth()+1}-${now.getYear()}`;
                        time = `${now.getHours()}:${now.getMinutes()}`;
                        price = await page.$eval('.course-price-text > span + span > span', e => e.innerText);                        
                        console.log(price);

                    },1000);
                } catch(err){
                    console.log(err);
                     browser.close();
                    reject(err.toString());
                }
            })
        });      
       
        browser.close();   
        
        res.render("index",{date,time,price});

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
        check();
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