'use strict';

const Pipeline = require("./pipeline");

function And(...conditions) {
    return Pipeline(...conditions);
}

module.exports = And;
