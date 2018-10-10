const fs = require('fs');

const readFile = (file, opts) => new Promise((resolve, reject) => fs.readFile(file, opts, (err, data) => {
    if(err) {
        return reject(err);
    }

    resolve(data);
}));

const parseData = (data) => {
    return new Promise((resolve, reject) => {
        try {
            resolve(JSON.parse(data));
        }
        catch(e) {
            reject('.go-credentials contains invalid JSON.');
        }
    });
}

const loadFile = (locations) => {
    const location = locations.pop();

    if(!location) {
        return Promise.resolve();
    }

    return readFile(location, 'utf-8')
        .catch(() => loadFile(locations));
}

module.exports = () => loadFile([
        `${process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']}/.go-credentials`,
        `${process.cwd()}/.go-credentials`
    ])
    .then(data => {
        if (!data) {
            return Promise.reject('Could not find .go-credentials file in any location.');
        }

        return parseData(data);
    });
