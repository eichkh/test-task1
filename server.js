require("dotenv").config();
const http = require("http");

const Database = require("./database/database.class");

(async () => {
    const db = new Database({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    });

    await db.connect();

    const server = http.createServer(async (req, res) => {
        if (req.url === "/calculate") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(await db.calculateReward()));
            res.end();
        }
    });

    server.listen(3000, () => {
        console.log(`Server is running on port 3000`);
    });
})();
