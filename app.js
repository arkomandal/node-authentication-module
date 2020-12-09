require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

app.use('/auth', require('./controllers/auth.route'));

app.listen(process.env.PORT, () => console.log(`server is listening on port ${process.env.PORT}`));