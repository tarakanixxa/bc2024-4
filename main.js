const { Command } = require('commander');
const http = require('http');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const superagent = require('superagent');

const program = new Command();

program
    .option('-h, --host <host>', 'address of the server')
    .option('-p, --port <port>', 'port of the server')
    .option('-c, --cache <cache>', 'path to cache directory')
    .parse(process.argv);

const options = program.opts();
const { host, port, cache } = options;

if (!host || !port || !cache) {
    console.error('All parameters are required: --host, --port, --cache');
    process.exit(1);
}

if (!fsSync.existsSync(cache)) {
    fsSync.mkdirSync(cache);
}

const server = http.createServer(async (req, res) => {
    const url = req.url;
    const method = req.method;
    const httpCode = url?.slice(1);
    const filePath = path.join(cache, `${httpCode}.jpg`);

    try {
        if (method === 'GET') {
            const image = await fs.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(image);
        } else if (method === 'PUT') {
            const chunks = [];
            req.on('data', (chunk) => {
                chunks.push(chunk);
            });
            req.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                await fs.writeFile(filePath, buffer);
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Image created');
            });
        } else if (method === 'DELETE') {
            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Image deleted');
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Fetching image for HTTP code: ${httpCode}`);
            try {
                const response = await superagent.get(`https://http.cat/${httpCode}`);
                console.log(`Received response with status: ${response.status}`);
                console.log(`Response headers:`, response.headers);
                const imageBuffer = Buffer.from(response.body, 'binary');
                await fs.writeFile(filePath, imageBuffer);
                console.log(`Image saved to: ${filePath}`);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(imageBuffer);
            } catch (fetchError) {
                console.error(`Fetch error: ${fetchError.message}`);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        } else {
            console.error(`Server error: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }
});

server.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}/`);
});
