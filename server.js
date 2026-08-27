const fs = require('fs');
const http = require("http");
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const port = 3000;
const Pastebin_API_Key = "API_KEY";

const server = http.createServer();
server.on("request", request_handler);
function request_handler(req, res){
    console.log(`New Request from ${req.socket.remoteAddress} for ${req.url}`);
    if(req.url === "/"){
    const form = fs.createReadStream("index.html");
    res.writeHead(200, "OK", {'Content-Type':'text/html'});
    form.pipe(res);
    }
    else if(req.url === "/yes?"){
        const qotd = https.request('https://favqs.com/api/qotd');
        qotd.on("response", (qotd_response) => process_stream(qotd_response, paste_results, res));
        qotd.end();
    }
    else if(req.url === "/no?"){
        res.writeHead(200, "OK", {"Content-Type": "text/html"});
        res.write('<h1>No Quote Generated</h1>');
        res.end();
    }
    else{
        res.writeHead(404, "Not Found", {"Content-Type": "text/html"});
        res.write('<h1>404 Not Found</h1>');
        res.end();
    }
}

server.on("listening", listen_handler)
function listen_handler(){
    console.log(`Now Listening on Port ${port}`)    
}
server.listen(port);

function process_stream(stream, callback, ...args){
    let body = "";
    stream.on("data", chunk => body += chunk);
    stream.on("end", () => callback(body, ...args));
}

function paste_results(data, res){
    const json = JSON.parse(data);
    const quote = json.quote.body;
    const author = json.quote.author;
    const text = `"${quote}" - ${author}`;
    const post_data = querystring.stringify({
        api_dev_key: Pastebin_API_Key,
        api_option: 'paste',
        api_paste_code: text,
        api_paste_private: '1',
        api_paste_name: 'QOTD',
        api_paste_expire_date: '1D'
    });

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    const paste_req = https.request("https://pastebin.com/api/api_post.php", options, (pasteres) => {
        process_stream(pasteres, show_link, res);
    });
    paste_req.end(post_data);
}

function show_link(body, res){
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(`<h1>Pastebin Link With Quote</h1><a href="${body}" target = "_blank">${body}</a>`);
}