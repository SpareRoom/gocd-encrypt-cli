const request = require('request');

module.exports = (config, data) => new Promise((resolve, reject) => {
    let host = config.host;

    const options = {
        url: `${host}/go/api/admin/encrypt`,
        method: 'POST',
        json: { value: data },
        headers: {
            'Accept': 'application/vnd.go.cd.v1+json',
            'Content-Type': 'application/json'
        }
    };

    if(config.username) {
        options.auth = { user: config.username, pass: config.password };
    }

    request(options, (err, response, data) => {
        if(response.statusCode !== 200) {
            if(response.statusCode === 401) {
                return reject(`Authentication failed`);
            }

            return reject(`GO returned non-success response: ${response.statusCode}`);
            console.log(data);
        }

        return resolve(data);
    })
});
