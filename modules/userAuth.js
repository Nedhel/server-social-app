const fs = require("fs");

function authenticateUser(userEmail, password) {
    let data = fs.readFileSync("./data/userData.json");
    let users = JSON.parse(data);
    console.log(userEmail, password);
    if (users[userEmail] && users[userEmail].password === password) {
        return true;
    }
}

module.exports = {
    authenticateUser,
};
