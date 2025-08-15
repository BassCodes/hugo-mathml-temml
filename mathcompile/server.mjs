// Copyright 2025 Alexander Bass
// MIT License
import * as http from "http";
import { default as temml } from "./temml.mjs";
const HOST = "localhost";
const PORT = 31416;

// TEMML COMPILE OPTIONS
const OPTIONS = {
  trust: true,
  xml: false,
  strict: true,
  displayMode: true,
  annotate: false,
  throwOnError: true,
};

// Example matching string ... /tex2math/inline/cCA9IFx0ZnJhY3sxfXtifQ==?0
const URL_REGEX = /\/tex2math\/(inline|block)\/([a-zA-Z0-9+=]+)/g;

function extractTex(url) {
  let [_, mode, data] = url.matchAll(URL_REGEX).next().value;
  if (mode === undefined || data === undefined) {
    return { error: "Unable to extract data from url" };
  }
  let block = mode === "block";
  try {
    var tex = atob(data).trim();
  } catch (e) {
    return { error: `Could not decode base64: ${e}` };
  }
  return { block, tex };
}

const server = http.createServer();
server.on("request", async (req, res) => {
  let url = req.url;
  console.log(`MATH: Got request: ${url}`);
  const output = extractTex(url);
  if (output.error) {
    res.writeHead(404);
    res.write(output.error);
    res.end();
    return;
  }
  const { block, tex } = output;
  let options = structuredClone(OPTIONS);
  options.displayMode = block;

  console.log(`MATH: compiling "${tex}"`);
  try {
    const encodedMathMl = temml.renderToString(tex, options);
    res.setHeader("content-type", "application/json");
    res.writeHead(200);
    res.write(JSON.stringify({ data: encodedMathMl }));
  } catch (e) {
    console.log(`MATH: compile failed: ${e}`);
    res.writeHead(400);
    res.write(`Math Compile Error: ${e}`);
  }
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`Math compile server is running on http://${HOST}:${PORT}`);
});
