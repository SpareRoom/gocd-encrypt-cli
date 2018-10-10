const program = require("commander");
const loadCredentials = require("./load-credentials");
const goEncrypt = require("./go-encrypt");
const fs = require("fs");
const yaml = require("js-yaml");
const { version } = require("../package.json");

function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(`${process.cwd()}/${file}`, "utf-8", (err, data) => {
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
        const path = file[0] === "/" ? file : `${process.cwd()}/${file}`;
       
        fs.writeFile(path, data, "utf8", (err) => {
            if(err) {
                return reject(err);
            }

            resolve();
        });
    });
}

function appendToFile(config, result) {
    const path = config.outputFile[0] === "/" ? config.outputFile : `${process.cwd()}/${config.outputFile}`;

    const yamlFile = yaml.safeLoad(fs.readFileSync(path, "utf8"));

    if (yamlFile.environments) {
        console.log(`Appending to file: ${config.outputFile}, environment: ${config.outputEnvironment} with key: ${config.outputKey}`);
        if (!yamlFile.environments[config.outputEnvironment].secure_variables) {
            yamlFile.environments[config.outputEnvironment].secure_variables = {};
        }

        yamlFile.environments[config.outputEnvironment].secure_variables[config.outputKey] = result.encrypted_value;
    }
    else {
        if (!config.outputPipeline && Object.keys(yamlFile.pipelines).length > 1) {
            throw new Error("No output pipeline specified");
        }

        const pipeline = config.outputPipeline || Object.keys(yamlFile.pipelines)[0];

        console.log(`Appending to file: ${config.outputFile}, pipeline: ${pipeline} with key: ${config.outputKey}`);

        if (!yamlFile.pipelines[pipeline].secure_variables) {
            yamlFile.pipelines[pipeline].secure_variables = {};
        }

        yamlFile.pipelines[pipeline].secure_variables[config.outputKey] = result.encrypted_value;
    }

    return writeFile(config.outputFile, yaml.safeDump(yamlFile));
}

function readAndEncrypt(config, credentials, file) {
    return readJsonFile(config, file)
        .then(data => encryptValue(config, credentials, data));
}

function encryptValue(config, credentials, data) {
    return goEncrypt(config, credentials, data)
        .then(result => {
            if (config.outputFile) {
                return appendToFile(config, result);
            }
            
            console.log(`Encrypted Result:\n${result.encrypted_value}`);
        });
}

function encryptJsonFile(config, file) {
    return loadCredentials()
        .then(credentials => readAndEncrypt(config, credentials, file))
        .catch(err => console.error(err));
}

function encrypt(config, value) {
    loadCredentials()
        .then(credentials => encryptValue(config, credentials, value))
        .catch(err => console.error(err));
}

const getOptionsFromProgram = ({ host, output, environment, pipeline, key }) => ({
    host,
    output,
    environment,
    pipeline,
    key
});

module.exports = function() {
    program
        .version(version)
        .description("Encrypts specified vale or json files with the GOCD encryption api")
        .option("-h, --host <host>", "GO Server host")
        .option("-o, --output <outputfile>", "Target output configuration file")
        .option("-e, --environment <outputenvironment>", "Target output environment")
        .option("-p, --pipeline <outputpipeline>", "Target output pipeline")
        .option("-k, --key <outputkey>", "Target configuration key for output file");

    program
        .command("encrypt-json [file]")
        .description("Encrypt the contents of the specified json file")
        .action(file => encryptJsonFile(getOptionsFromProgram(program), file));

    program
        .command("encrypt [value]")
        .description("Encrypt the provided value")
        .action(value => encrypt(getOptionsFromProgram(program), value));

    program.parse(process.argv);
};
