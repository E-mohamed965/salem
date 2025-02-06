const express= require('express');
const app=express();
require('dotenv/config');
const bodyParser=require('body-parser');
const cors=require('cors');
const morgan=require('morgan');
const mongoose=require('mongoose')
const Product=require('./models/rooms');
const roomRouter=require('./routes/rooms');
const categoryRouter=require('./routes/category');
const userRoute=require('./routes/user');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
const bookingRoute=require('./routes/booking');
const rateLimit= require('express-rate-limit')

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100, 
	standardHeaders: 'draft-8',
	legacyHeaders: false, 
	
})



app.use(errorHandler);
app.use(limiter)
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

  

app.use('/rooms',roomRouter)
app.use('/users',userRoute)
app.use('/booking',bookingRoute)
mongoose.connect(process.env.CONNECTION_STRING)
.then(()=>{
      console.log("connected succefully");
})
.catch((err)=>{
      console.log(err);
})

app.listen(3002,()=>{
      console.log("connectedSuccefully")
})