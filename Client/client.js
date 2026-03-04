ReactDOM.createRoot(document.querySelector("#root")).render(<App></App>);

// ALLA FUNKTIONER MED STOR BOKSTAV
// får endast return ett element, därför måste alltid return ha en div
function App() {


    const [post, setPost] = React.useState([]);


    return (
        <div>
            <Header></Header>
            <Create  setPost={setPost}></Create>
            <EditPost editPost = {editPost} setPost = {setPost}></EditPost>
            <Fyp post ={post} setPost={setPost}></Fyp>
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

function Fyp({post, setPost}){
  
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
        event.preventDefault();

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
        setPost(prev => [data, ...prev]);


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
function EditPost(id, updatedPost) {

    async function EditPostF(event){

        event.preventDefault();

        const updatedPost = {
        title: event.target.title.value || post.name,
        description: event.target.description.value || post.description,
        body: JSON.stringify(updatedPost)    
        };

        const res = await fetch("/posts/"+ post.id,{
            metod: "PUT",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(updatedPost)
        });
        
        const data = await res.json();

        console.log("status", res.status, data.message);
        if(res.ok){
            setPosts(prev=>
                prev.map(p=>
                    p.if===post.id?{...p, ...updatedPost}: p
                )
            );
        }
    }

    return(
        <div className="editDiv">

            <form onSubmit={EditPostF}>
                <input type="text" name="title" placeholder="title"/>
                <input type="text" name="description" placeholder="description"/>
                <input type="text" name="photo" placeholder="photo"/>
                <input type="submit" value="Save"/>

            </form>
        </div>
    )

}