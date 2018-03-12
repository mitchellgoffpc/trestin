const path = require('path')
const express = require('express')

const app = express()
const port = process.env.PORT || 8080
const indexPath = path.join(__dirname, './build/index.html')
const publicPath = express.static(path.join(__dirname, './build'))

app.use('/assets', publicPath)
app.get('/', function (_, res) { res.sendFile(indexPath) })
app.listen(port)

console.log(`Listening at http://localhost:${port}`)
