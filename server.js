require('dotenv').config();

const https = require('https');
const fs = require('fs');
const app = require('./src/app'); 

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/sgardencity.in/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/sgardencity.in/cert.pem')
};

https.createServer(options,app).listen(process.env.PORT,() => {
console.log(`server is running ${process.env.PORT}`);
});
