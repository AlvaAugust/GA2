const express = require("express");
const app = express();
const fs = require("fs").promises;
const port = process.env.port || 3000;

app.listen(port,()=>{
    console.log("http://localhost:" + port);
});

app.use(express.json());
app.use(express.static("client"));

//routes

app.get("/posts", async (req,res)=>{
    const posts = await fs.readFile("posts.json");
    res.json(JSON.parse(posts));
});
    

