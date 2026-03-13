// Needed to load the .env environment variables
// to process.env

// Load dotenv in CommonJS
const dotenv = require("dotenv"); //import dotenv from "dotenv";

// Configure dotenv with a custom path
dotenv.config({ path: "../../../.env" });
