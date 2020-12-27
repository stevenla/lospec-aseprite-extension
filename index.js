#!/usr/bin/env node

const fetch = require("node-fetch");
const fs = require("fs/promises");
const FS_CONSTANTS = require("fs").constants;
const path = require("path");

const EXTENSION_PATH = path.resolve(__dirname, "lospec-palettes");
const PACKAGE_JSON_PATH = path.resolve(EXTENSION_PATH, "package.json");
const LOSPEC_PATH = "https://lospec.com/palette-list";

const DEFAULT_PACKAGE_JSON = `\
{
  "name": "lospec-palettes",
  "displayName": "Lospec Palettes",
  "description": "Palettes synced with lospec-aseprite-extension",
  "version": "1.0",
  "publisher": "Steven La <mrstevenla@gmail.com>",
  "categories": [
    "Palettes"
  ],
  "contributes": {
    "palettes": []
  }
}
`;

async function readPackageJson() {
  // Make the folder if it doesn't exist
  try {
    await fs.access(EXTENSION_PATH, FS_CONSTANTS.F_OK | FS_CONSTANTS.W_OK);
  } catch (e) {
    await fs.mkdir(EXTENSION_PATH);
  }

  // Read the file
  let contents = DEFAULT_PACKAGE_JSON;
  try {
    contents = await fs.readFile(PACKAGE_JSON_PATH, "utf-8");
  } catch (e) {}

  return JSON.parse(contents);
}

async function writePackageJson(package) {
  const contents = JSON.stringify(package, null, 2);
  await fs.writeFile(PACKAGE_JSON_PATH, contents, "utf-8");
}

async function syncJson() {
  const json = await readPackageJson();
  const palettes = [];
  const filenames = await fs.readdir(EXTENSION_PATH);
  for (const filename of filenames) {
    if (!filename.includes(".gpl")) {
      continue;
    }
    const filepath = path.resolve(EXTENSION_PATH, filename);
    const contents = await fs.readFile(filepath, "utf-8");
    const [, name] = contents.match(/Palette Name: (.*)/);
    palettes.push({ id: name, path: `./${filename}` });
  }
  json.contributes.palettes = palettes;
  writePackageJson(json);
}

async function fetchLospec(slug) {
  const gplRes = await fetch(`${LOSPEC_PATH}/${slug}.gpl`);
  const gplBuf = await gplRes.buffer();
  await fs.writeFile(path.resolve(EXTENSION_PATH, `${slug}.gpl`), gplBuf);
}

async function main() {
  const [, , name] = process.argv;
  if (name) {
    await fetchLospec(name);
  }
  await syncJson();
}

main();
