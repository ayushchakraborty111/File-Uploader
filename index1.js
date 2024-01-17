const http = require("http");
const { Worker } = require("worker_threads");
const port = 7000;

const server = http.createServer((req, res) => {
  var body = "";
  if (req.url === '/' && req.method == "GET") {
    res.end('<h1>Hello</h1>');
  }
  if (req.method == "POST" && req.url == "/post-data") {
    req.on("data", (chunk) => {
      body += Buffer.from(chunk, "binary").toString("binary");
    });
    req.on("end", () => {
      try {
        const worker = new Worker('./worker.js', {
          workerData: { body },
        });

        worker.on("message", (result) => {
          const jsonString = JSON.stringify(result, null, 2); // Adds indentation for better readability
          res.writeHead(200, { "Content-Type": "application/json" });
          res.write(jsonString);
          res.end();
        });

        worker.on("error", (err) => {
          res.statusCode = 400;
          res.end(`Error with statusCode: ${res.statusCode}`);
          console.error(err);
        });
      } catch (err) {
        res.statusCode = 400;
        res.end(`Error with statusCode: ${res.statusCode}`);
        console.log(err);
      }
    });
  }
});

server.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
