require('dotenv').config();

let { PORT } = process.env;

PORT = PORT || 8080;

module.exports = {
    PORT
};