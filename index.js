require('dotenv').config();
const express=require('express')
const mongoose=require('mongoose')
const bodyParser = require('body-parser');
const dotenv=require('dotenv')
const cors=require('cors')
const path=require('path')
const cookieParser=require('cookie-parser')
const app=express()
const userRoute=require('./routes/userRoute')
const adminRoute=require('./routes/adminRoute');
const authRoute = require('./routes/authRoute');

app.use(cookieParser())
// dotenv.config();
app.use(express.json())
const corsOPtions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH' ],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-cookie']
};


app.use(cors(corsOPtions))
app.use(express.json())
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
const mongoURI = process.env.MONGO_URL;
if (!mongoURI) {
  console.error(" MongoDB URI is missing. Set MONGO_URI in .env file.");
  process.exit(1);
}

// mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(mongoURI)

.then(() => console.log(` MongoDB connected successfully to ${mongoose.connection.name}`))
  .catch((err) => {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
  });
  app.use('/user',userRoute)
  app.use('/admin',adminRoute)
  app.use('/auth',authRoute)

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${process.env.PORT || 3000}`);
  });
  