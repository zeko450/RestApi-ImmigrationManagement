const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('connected to database'));

//Set server accept JSON  // accept JSON as the data format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const accountsRouter = require('./routes/accounts');
const adminsRouter = require('./routes/demands');
const bugsRouter = require('./routes/bugs');
app.use('/accounts', accountsRouter);
app.use('/demands', adminsRouter);
app.use('/bugs', bugsRouter);


app.listen(3000, () => console.log("Server started"));
