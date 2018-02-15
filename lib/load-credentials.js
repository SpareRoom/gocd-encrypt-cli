const fs = require('fs');

function parseData(data) {
    return new Promise((resolve, reject) => {
        try {
            resolve(JSON.parse(data));
        }
        catch(e) {
            reject('.go-credentials contains invalid JSON.');
        }
    });
}

function loadFile(locations, resolve, reject) {
    const location = locations.pop();

    if(!location) {
        return reject('Could not find .go-credentials file in any location.');
    }

    fs.readFile(location, 'utf-8', (err, data) => {
        if(err) {
            return loadFile(locations, resolve, reject);
        }

        parseData(data)
            .then(config => resolve(config))
            .catch(err => reject(err));
    });
}

module.exports  = () => new Promise((resolve, reject) => {
    loadFile([
        `${process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']}/.go-credentials`,
        `${process.cwd()}/.go-credentials`
    ], resolve, reject);
});
