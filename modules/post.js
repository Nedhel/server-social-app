const fs = require("fs");

function readPost() {
    let data = fs.readFileSync("./data/post.json");
    let post = JSON.parse(data);
    return post;
}

function writePostJson(name, newPost) {
    let date = new Date();
    date = date.getTime().toString();
    const data = readPost();
    let id = parseInt(data.length);
    newPost = { id: id, date: date, owner: name, ...newPost };
    data.push(newPost);
    let newData = JSON.stringify([...data]);
    fs.writeFile(`./data/post.json`, newData, function (err) {
        if (err) throw err;
        console.log("Replaced!");
    });
}

module.exports = {
    readPost,
    writePostJson,
};
