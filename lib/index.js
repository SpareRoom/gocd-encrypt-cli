const program = require('commander');
const loadCredentials = require('./load-credentials');
const goEncrypt = require('./go-encrypt');
const fs = require('fs');
const yaml = require('js-yaml');

function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(`${process.cwd()}/${file}`, 'utf-8', (err, data) => {
            if(err) {
                return reject(err);
            }

            resolve(data);
        })
    });
}

function readJsonFile(file) {
    return readFile(file)
        .then(data => JSON.parse(JSON.stringify(data)));
}

function writeFile(file, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(`${process.cwd()}/${file}`, data, 'utf8', (err) => {
            if(err) {
                return reject(err);
            }

            resolve();
        })
    });
}

function appendToFile(config, result) {
    console.log(`Appending to file: ${config.outputFile}, environment: ${config.outputEnvironment} with key: ${config.outputKey}`);

    const yamlFile = yaml.safeLoad(fs.readFileSync(`${process.cwd()}/${config.outputFile}`, 'utf8'));

    if(!yamlFile.environments[config.outputEnvironment].secure_variables) {
        yamlFile.environments[config.outputEnvironment].secure_variables = { };
    }

    yamlFile.environments[config.outputEnvironment].secure_variables[config.outputKey] = result.encrypted_value;

    return writeFile(config.outputFile, yaml.safeDump(yamlFile));
}

function readAndEncrypt(config) {
    return readJsonFile(config.file)
        .then(data => goEncrypt(config, data))
        .then(result => {
            if(config.outputFile) {
                return appendToFile(config, result);
            }
            console.log(`Encrypted Result:\n${result.encrypted_value}`);
        });
}

function encryptJsonFile(config) {
    loadCredentials()
        .then(credentials => ({
            username: credentials.username,
            password: credentials.password,
            host: config.host || credentials.host,
            file: config.file,
            outputFile: config.outputFile,
            outputEnvironment: config.outputEnvironment,
            outputKey: config.outputKey
        }))
        .then(config => readAndEncrypt(config))
        .catch(err => console.error(err));
}

module.exports = function() {
    program
        .version('1.0.0')
        .description('Encrypts specified json files with the GOCD encryption api')
        .option('-h, --host <host>', 'GO Server host')
        .option('-o, --output <outputfile>', 'Target output configuration file')
        .option('-e, --environment <outputenvironment>', 'Target output environment')
        .option('-k, --key <outputkey>', 'Target configuration key for output file');

    program
        .command('encrypt-json [file]')
        .description('Encrypt the contents of the specified json file')
        .action(file => encryptJsonFile({
            host: program.host,
            outputFile: program.output,
            outputEnvironment: program.environment,
            outputKey: program.key,
            file: file
        }));

    program.parse(process.argv);
};
