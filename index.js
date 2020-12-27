const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379; //default redis port 

const app = require('express')();
const fetch = require('node-fetch');
const redis = require('redis');

const { promisify } = require('util');

const css = `<style> body{background-color:#001;color:white;font-family:Arial;font-weight 100;}h1 {font-weight:100;}a:link, a:visited{color:#ccc;text-decoration:none;font-variant:small-caps;border:1px solid;transition:background-color 0.5s ease; padding:0.3em;display:inline-block;text-align:center;width:300px;}ul{padding:0px;}li{list-style:none;} a:hover{background-color:white}</style>`;

const client = redis.createClient(REDIS_PORT);

const attl = promisify(client.ttl).bind(client);
const akeys = promisify(client.keys).bind(client);

//routes
app.get('/', async (req,res,next)=> {
    try {
        const title = "Node Redis Caching Example = Non Cached Page";
        let tmp = `<html><head><title>${title}</title>${css}</head><body><h1>${title}</h1><ul>`;
        const result = await fetch(`https://jsonplaceholder.typicode.com/users`);
        const data  = await result.json();
        data.map(d => { 
                tmp += `<li><a href="/users/${d.username}"> ${d.username} </a></li> `;
            });
        tmp += `</ul><a href="/users">cached page</a></body></html>`;
        res.send(tmp);
    } catch (err) {
        console.log(err.message);
        res.status(500);
    }});

    app.get('/users' ,  async (req,res,next) => { 
        try {
            const title = "Repo History - Cached Page";
            let tmp =  `<html><head><title>${title}</title>${css}<script>setInterval(()=>{window.location.href='/users';},1000)</script></head><body><h1>${title}</h1><ul>`;
            let keys = await akeys("*");
            for(let x = 0 ; x< keys.length ; x++) tmp += `<li>${keys[x]} - ${await attl(keys[x])} </li>`;
            tmp += `</ul><a href="/">back to main</a></body></html>`;  
            res.send(tmp);
        } catch (err) {
            console.log(err.message);
            res.status(500);
        }
    });

    app.get('/users/:username' ,async (req,res,next) => {
        try {
            let title = "User Added - Non Cached Page ";
            let tmp = `<html><head><title>${title}</title>${css}</head><body><h1>${title}</h1><ul>`;
            let { username } = req.params;
            let website = (await(await fetch(`https://jsonplaceholder.typicode.com/users?username=${username}`)).json())[0].website;
            client.setex(username,3600,website);
            tmp += `<li><strong>${username}</strong> has <strong>${website}</strong> and it has been cached</li>`;
            tmp += `</ul><a href="/"> back to main </a> </body></html>`;
            res.send(tmp);
        } catch (err) {
            console.log(err.message);
            res.status(500);
        }
    });

    app.listen(PORT,()=>{
        console.log(`app listening on port ${PORT}`);
    });
