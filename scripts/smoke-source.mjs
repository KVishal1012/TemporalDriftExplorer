import { readFileSync } from "node:fs";

const data = readFileSync("src/data.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const readme = readFileSync("README.md", "utf8");

const required = [
  ["Toronto profile", data.includes('city: "Toronto"')],
  ["Chennai profile", data.includes('city: "Chennai"')],
  ["Canada market", data.includes('country: "Canada"')],
  ["India market", data.includes('country: "India"')],
  ["City switcher", app.includes("selectCity")],
  ["Market badge", app.includes("Canada + India only")],
  ["README launch markets", readme.includes("Launch Markets")],
];

const forbidden = ["Detroit", "Woodward", "detroit-corridor", "commercial collapse"];

const failures = [
  ...required.filter(([, passed]) => !passed).map(([label]) => `Missing: ${label}`),
  ...forbidden.filter((term) => data.includes(term) || app.includes(term) || readme.includes(term)).map((term) => `Stale term: ${term}`),
];

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Smoke source checks passed for Canada + India launch scope.");
