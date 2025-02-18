const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');


const filenames = {
    csv: 'rooms.csv',
    html: 'index.html'
};

const csvFile = fs.readFileSync(`../data/${filenames.csv}`, 'utf8');
const htmlFile = fs.readFileSync(`../public/${filenames.html}`, 'utf8');
// console.log(csvFile);

const server = http.createServer((req, res) => {
    const parsedURL = url.parse(req.url);
    const queryParams = querystring.parse(parsedURL.query);
    // console.log(queryParams['roomType']);


    if (parsedURL.pathname === '/search' && req.method === 'GET') {
        let type = queryParams['roomType'];
        if (type) {
            type = type.toLowerCase();
            const rooms = csvFile.split('\n').map(room => room.split(','));
            const filteredRooms = rooms.filter(room => room[1] === type).filter(room => room[3].includes('available'));
            console.log(rooms);
            console.log(filteredRooms);

            // let resultHTML = '';
            // filteredRooms.forEach(room => {
            //     resultHTML += `<tr>
            //                    <td>${room[0]}</td> 
            //                    <td>${room[1]}</td>
            //                    <td>${room[2]}</td>
            //                    </tr>`;
            // });
            // res.writeHead(200, { 'Content-Type': 'text/html' });
            // res.end(htmlFile.replace('<tbody></tbody>', `<tbody>${resultHTML}</tbody>`));
            res.end(htmlFile);
        }
    };
});

const port = 3000;
const host = 'localhost';
server.listen(port, host, () => {
    console.log(`Listening on port ${port}`);
});