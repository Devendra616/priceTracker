# Price Tracker

### Build an app that runs a script once every 1 hours and checks to see if a price on a course at udemy has changed (e.g., gone on sale) then notify user by email.

## install [puppeteer](https://github.com/GoogleChrome/puppeteer)


## install [puppeteer-extra](https://www.npmjs.com/package/puppeteer-extra)
 
 npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth nodemailer email-templates

 You can just visit the [package.json](./package.json) and use *npm install*

 Sesitive informations like fromMailId, fromMailPassword, toMailId are set in the .env file
 Create a file named .env at the home folder of the application. And make entries like
 ```
    MAILID=your_from_mail_id_gmail
    MAILPASSWORD=from_mail_password
    MAILTO=to_mail_id
    MAILTOUSER=to_mail_username
 ``` 
 

#### Run the application using 
```nodejs
node app.js
```
Open the browser and visit *localhost:3000*
It asks for url to check : give the udemy course url which needs to be tracked

After each hour mail is sent as configured in the env file. The email snapshot is 
<a href='https://res.cloudinary.com/nmdc/image/upload/v1570282553/Price%20Alert/Capture.jpg'><img src='https://res.cloudinary.com/nmdc/image/upload/v1570282553/Price%20Alert/Capture.jpg' alt='email snapshot'></a>

Captured Snapshots of browser at each hour :

<a href='https://res.cloudinary.com/nmdc/image/upload/v1570282701/Price%20Alert/price-5-11hh_12mm.png' target='_blank'><img src="https://res.cloudinary.com/nmdc/image/upload/v1570282701/Price%20Alert/price-5-11hh_12mm.png" height="800" width="300" alt='course snapshot'></a>

