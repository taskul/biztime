const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    port: process.env.PORT
};