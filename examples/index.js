#!/usr/bin/env node

const html = require("hyperx")(require("hyperscript"))
const http = require("http")
const fs = require("fs")
const path = require("path")
const browserify = require("browserify")
const babelify = require("babelify")

const getRoutes = dir =>
    fs.readdirSync(dir).filter(file =>
        fs.statSync(path.join(dir, file)).isDirectory())

http.createServer((req, res) => {
    const routes = getRoutes(__dirname + "/dir/")
    const match = req.url.match(/^\/static\/([a-z0-9]+)\/bundle\.js$/)

    if (req.url === "/") {
        res.write(html`<body><ul>${routes.map(name =>
            html`<li><a href="${name}">${name}</a></li>`)}</ul></body>`.outerHTML)
        res.end()

    } else if (match && match.length >= 1) {
        res.setHeader("content-type", "application/javascript")
        browserify(`${__dirname}/dir/${match[1]}/index.js`)
            .transform(babelify, {
                presets: ["latest"],
                plugins: ["transform-object-rest-spread"]
            })
            .bundle().on("error", e => {
                console.error(e)
                res.writeHead(500, e.toString())
                res.end()
            }).pipe(res)

    } else {
        routes.filter(name => `/${name}` === req.url).forEach(name => {
            res.write(`<body><script src="static/${name}/bundle.js"></script></body>`)
            res.end()
        })
    }
}).listen(process.env.PORT || 8080, _ => console.log("ok"))
