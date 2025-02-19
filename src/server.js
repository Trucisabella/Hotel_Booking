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

const server = http.createServer((req, res) => {
    const parsedURL = url.parse(req.url);
    const queryParams = querystring.parse(parsedURL.query);
    let pathComponents, roomID;
    if (parsedURL.pathname.includes('/id')) {
        pathComponents = parsedURL.pathname.split('/');
        roomID = pathComponents[2];
    }


    switch (parsedURL.pathname) {
        case '/':
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlFile);
            break;

        case '/search':
            let resultHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Room Number</th>
                    </tr>
                </thead>
                <tbody>
            `;
            let type = queryParams['roomType'];
            if (type) {
                type = type.toLowerCase();
                const rooms = csvFile.split('\n').map(room => room.split(','));
                const filteredRooms = rooms.filter(room => room[1] === type).filter(room => room[3].includes('available'));
                filteredRooms.forEach(room => {
                    resultHTML += ` <tr>
                                    <td><a href="/id/${room[0]}">${room[0]}</a></td> 
                                    </tr>`;
                });
            };
            resultHTML += `</tbody></table>`;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlFile.replace('<div id="roomNums"></div>', `<div id="roomNums">${resultHTML}</div>`));
            break;

        case `/id/${roomID}`:
            let roomDetails = `
            <table>
                <thead>
                    <tr>
                        <th>Room ID</th>
                        <th>Room Type</th>
                        <th>Price</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
            `;
            const rooms = csvFile.split('\n').map(room => room.split(','));
            const room = rooms.find(room => room[0] === roomID);
            if (room) {
                roomDetails += `
                <tr>
                    <td>${room[0]}</td>
                    <td>${room[1]}</td>
                    <td>${room[2]}</td>
                    <td>${room[3]}</td>
                </tr>`;
            } else {
                roomDetails += `
                <tr>
                    <td colspan="4">Room not found</td>
                </tr>`;
            }
            roomDetails += `</tbody></table>`;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlFile.replace('<div id="roomDetails"></div>', `<div id="roomDetails">${roomDetails}</div>`));
            break;

        case '/booking':
            let reqData = '';
            let reqParams = {};
            req.on('data', function (chunk) {
                reqData += chunk.toString();
                console.log("reqData: ", reqData);
            });
            req.on("end", () => {
                reqParams = querystring.parse(reqData);
                console.log("reqParams: ", reqParams);
                const checkInDate = new Date(reqParams.checkIn).toISOString().split("T")[0];

                const checkOutDate = new Date(reqParams.checkOut).toISOString().split("T")[0];


                if (checkInDate > checkOutDate) {
                    res.writeHead(400, { "Content-Type": "text/html" });
                    res.end("<h3>Error: Check-in date cannot be after check-out date!</h3>");
                }
                else {
                    let bookingInfo = {
                        Name: reqParams.username,
                        RoomType: reqParams.roomType,
                        RoomNumber: reqParams.roomNum,
                        CheckIn: checkInDate,
                        CheckOut: checkOutDate
                    };

                    let bookingDetails = `
                    <p>Customer: ${reqParams.username}</p>
                    <p>Room Type: ${reqParams.roomType}</p>
                    <p>Check In: ${checkInDate}</p>
                    <p>Check Out: ${checkOutDate}</p>
                    `;

                    let bookings = [];

                    if (fs.existsSync(`../data/bookings.json`)) {
                        const existingBookings = fs.readFileSync(`../data/bookings.json`, 'utf8');
                        if (existingBookings) {
                            bookings = JSON.parse(existingBookings);
                        }
                    }

                    bookings.push(bookingInfo);
                    let jsonBooking = JSON.stringify(bookings);
                    fs.writeFileSync(`../data/bookings.json`, jsonBooking);
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(`<h3>Booking Successfully. Thank you!</h3>${bookingDetails}`);
                }
            });
            break;

        default:
            console.log(parsedURL.pathname);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            break;
    };

});

const port = 8000;
const host = 'localhost';
server.listen(port, host, () => {
    console.log(`Listening on port ${port}`);
});