import React from "react";

ReactDOM.createRoot(document.querySelector("#root")).render(App());

// ALLA FUNKTIONER MED STOR BOKSTAV
// får endast return ett element, därför måste alltid return ha en div

function App() {
    return (
        <div>
            <Header></Header>
            <Fyp></Fyp>
        
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

function Fyp(){
    const [post, setPost] =React.useState([]);
    React.useEffect(()=>{
        getPost();
    }, []);

    async function getPost(){
        const res = await fetch("/posts");
        const data = await res.json();
        setPost(data);
    };

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
                </div>
            ))}
        </div>
    );
};
