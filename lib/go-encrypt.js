const request = require("request");

const requestPromise = (options) => new Promise((resolve, reject) => {
    request(options, (err, response, data) => {
        if (err) {
            return reject(err);
        }

        return resolve({ response, data });
    })
});

module.exports = (config, { host, username, password }, value) => {
    const options = {
        url: `${host || config.host}/go/api/admin/encrypt`,
        method: "POST",
        json: {
            value,
        },
        headers: {
            "Accept": "application/vnd.go.cd.v1+json",
            "Content-Type": "application/json",
        },
    };

    if(username) {
        options.auth = { user: username, pass: password };
    }

    return requestPromise(options)
        .then(({ response, data }) => {
            if (response.statusCode === 401) {
                throw new Error(`Authentication failed`);
            }
        
            if(response.statusCode !== 200) {
                throw new Error(`GO returned non-success response: ${response.statusCode}`);
            }
        
            return data;
        });
};
