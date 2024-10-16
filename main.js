const { Command } = require('commander');
const http = require('http');
const fs = require('fs/promises');
const path = require('path');

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


const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is running...');
});

server.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}/`);
});
