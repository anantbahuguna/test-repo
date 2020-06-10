const CLI = require("clui");
const ConfigStore = require("configstore");
const { Octokit } = require("@octokit/rest");
const Spinner = CLI.Spinner;
const { createBasicAuth } = require("@octokit/auth-basic");

const inquirer = require("./inquirer");
const pkg = require("../package.json");

const conf = new ConfigStore(pkg.name);

let octokit;

module.exports = {
    getInstance: () => {
        return octokit;
    },

    getStoredGithubToken: () => {
        // conf.set("github.token", "8b1c9e2f3e91576c9b822f6ede2edc5a5ae40c97");
        return conf.get("github.token");
    },

    githubAuth: (token) => {
        octokit = new Octokit({
            auth: token,
        });
    },

    getPersonalAccessToken: async () => {
        const credentials = await inquirer.askGithubCredentials();
        const status = new Spinner("Authenticating you, please wait...");

        status.start();

        const auth = createBasicAuth({
            username: credentials.username,
            password: credentials.password,
            async on2Fa() {},
            token: {
                scopes: ["user", "public_repo", "repo", "repo:status"],
                note: "ginit, the command-line tool for initializing Git repos",
            },
        });

        try {
            const res = await auth();

            if (res.token()) {
                conf.set("github.token", res.token);
                return res.token;
            } else {
                throw new Error("Github token was not found in the response");
            }
        } finally {
            status.stop();
        }
    },
    createGitignore: async () => {
        const filelist = _.without(fs.readdirSync("."), ".git", ".gitignore");

        if (filelist.length) {
            const answers = await inquirer.askIgnoreFiles(filelist);

            if (answers.ignore.length) {
                fs.writeFileSync(".gitignore", answers.ignore.join("\n"));
            } else {
                touch(".gitignore");
            }
        } else {
            touch(".gitignore");
        }
    },
};
