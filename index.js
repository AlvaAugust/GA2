const express = require("express");
const app = express();
const fs = require("fs").promises;
const port = process.env.port || 3000;

app.listen(port,()=>{
    console.log("http://localhost:" + port);
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("client"));

const {getData, saveData} = require("./function")


//routes
app.get("/posts", async (req,res)=>{
    const posts = await fs.readFile("posts.json");
    res.json(JSON.parse(posts));
});


//Create
app.post("/create", async (req,res)=>{
    const post = req.body;
    post.id = "id_" + Date.now();

    //När sessions implementeras ska detta läggas till
    // prod.uid = req.session.uid;

    const allPosts = await getData("posts.json");
    allPosts.push(post);

    await saveData(allPosts, "posts.json");
    res.json(post);
});

app.post("/register", async (req,res)=>{
    const { username, password } = req.body;

    //trim() ifall space är innan namnet så tas det bort
    if (!username || !username.trim() || !password || !password.trim()) {
        return res.status(400).json({ success: false, error: "Required" });
    }

    const accounts = await getData("accounts.json");
    const exist = accounts.find(acc => acc.username.toLowerCase() === username.trim().toLowerCase());
    if (exist) {
        return res.status(400).json({ success: false, error: "Username already exists." });
    }

    //trim tar bort mellanslaget framför
    const account = {
        uid: "uid_" + Date.now(),
        username: username.trim(),
        password: password.trim()
    };

    accounts.push(account);
    await saveData(accounts, "accounts.json");

    return res.status(201).json({ success: true, account });
});

//delete
app.delete("/posts/:id", async (req,res) => {
    const allPosts = await getData("posts.json");
    let filteredPosts = allPosts.filter(p=>p.id != req.params.id);
    
    //ingen tas bort
    if(filteredPosts.length == allPosts.length)
    {
        return res.status(400).json({error:"nothing deleted"})
    }
    await saveData(filteredPosts, "posts.json");
    res.status(200).json({message:"deleted"})

});

//edit..
app.put("/posts/:id", async (req,res)=>{
    const id = req.params.id
    const allPosts = await getData("posts.json");
    const updatedPost = allPosts.find(p=>p.id == id);
    if(!updatedPost)return res.status(404).json({success: false, message: "Post doesn't exist"})

    updatedPost.title= req.body.title || updatedPost.title;
    updatedPost.description= req.body.description || updatedPost.description;
    updatedPost.photo= req.body.photo || updatedPost.photo;

    await saveData(allPosts, "posts.json");

    res.status(200).json({success:true, message:"Post has been updated"})

});

app.get("#login", async (req,res)=>{
    res.send("login");
});
