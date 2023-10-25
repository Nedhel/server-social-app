const fs = require("fs");

function readPost() {
    let data = fs.readFileSync("./data/post.json");
    let post = JSON.parse(data);
    return post;
}

module.exports = {
    readPost,
};
