ReactDOM.createRoot(document.querySelector("#root")).render(<App></App>);

// ALLA FUNKTIONER MED STOR BOKSTAV
// får endast return ett element, därför måste alltid return ha en div
function App() {


    const [post, setPost] = React.useState([]);
    const [editingPost, setEditingPost] = React.useState(null);
    const editPost = (id) => {
        const postToEdit = post.find(p => p.id === id);
        setEditingPost(postToEdit);
    };

    return (
        <div>
            <Header></Header>
            <EditPost editingPost={editingPost} setEditingPost={setEditingPost} setPost={setPost}></EditPost>
            <Fyp post ={post} setPost={setPost} editPost={editPost}></Fyp>
            <Create  setPost={setPost}></Create>
            <Register></Register>
        </div>
    );
};


function Header() {

    return (
        <header>
            <h1>Titel</h1>
                <nav>
                    <a href="/">HOME</a>
                    <a href="#create">CREATE</a>
                    <a href="#register">REGISTER</a>
                    <a href="#login">LOGIN</a>
                </nav>
        </header>
    );
};

function Fyp({post, setPost, editPost}){
  
    React.useEffect(()=>{
        getPost();
    }, []);

    //hämtar posts
    async function getPost(){
        const res = await fetch("/posts");
        const data = await res.json();
        setPost(data);
    };

    //raderar posts
    async function deletePost(id){
        const res = await fetch("/posts/" + id, {
            method: "DELETE"
        });
        if (res.status == 200)
            setPost(prev => prev.filter(p=>p.id != id));
    };
    

    return (
        <div>
            <h2>FYP</h2>
            {post.map(p=>(
                <div className="post" key={p.id}>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <p>{p.id}</p>
                    <button onClick={()=>deletePost(p.id)}>Delete</button>
                    <button onClick={()=>editPost(p.id)}>Edit</button>
                </div>
            ))}
        </div>
    );
};



function Create({setPost}){
    async function savePost(event){
        event.preventDefault(); //stoppar webbsidan från att reload

        const post = {
            title: event.target.title.value,
            description: event.target.description.value
        };  

        const res = await fetch("/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(post)
        }); 

        const data = await res.json();
        console.log(data);  
        setPost(prev => [data, ...prev]); //new post appears on top of list, doesn't need to refetch
    }


    return (
        <div id = "create" className="content">
            <h2>Create</h2>
            <form action="/create" method="post" onSubmit={savePost}>
                <input type="text" name="title" placeholder="Title" required />
                <textarea name="description" placeholder="Description" required></textarea>
                <button type="submit">Create Post</button>
            </form>
        </div>
    );
}

//update a post
function EditPost({editingPost, setEditingPost, setPost}) {

    async function EditPostF(event){

        event.preventDefault();

        const updatedPost = {
            title: event.target.title.value || editingPost.title,
            description: event.target.description.value || editingPost.description,
            photo: event.target.photo.value || editingPost.photo
        };

        const res = await fetch("/posts/"+ editingPost.id,{
            method: "PUT",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(updatedPost)
        });
        
        const data = await res.json();

        console.log("status", res.status, data.message);
        if(res.ok){
            setPost(prev=>
                prev.map(p=>
                    p.id === editingPost.id ? {...p, ...updatedPost} : p
                )
            );
            setEditingPost(null); // close edit form
        }
    }
    if (!editingPost) return null; // don't render if no post to edit

    return(
        <div className="editDiv">

            <form onSubmit={EditPostF}>
                <input type="text" name="title" placeholder="title" defaultValue={editingPost.title}/>
                <input type="text" name="description" placeholder="description" defaultValue={editingPost.description}/>
                <input type="text" name="photo" placeholder="photo" defaultValue={editingPost.photo}/>
                <input type="submit" value="Save"/>
                <button type="button" onClick={() => setEditingPost(null)}>Cancel</button>
            </form>
        </div>
    )

}
// defaultValue={}   visar vad den har för value, prefilling a form

function Register({SetRegister}){
    async function saveAccount(event){
        event.preventDefault(); //stoppar webbsidan från att reload

        const account= {
            username: event.target.username.value,
            password:event.target.password.value,
            uid: event.target.uid.value
        }
        const res = await fetch("/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(account)
        });
        const data = await res.json();
        console.log(data);
    }

    return(
        <div>
            <h2>Register</h2>
            <form  action ="/register" method="post "onSubmit={saveAccount}>
                <input type="text" name="username" placeholder="Username"/>
                <input type="password" name="password" placeholder="Password"/>
                <button type="submit">Create Account</button>
                
            </form>
        </div>
    )
}