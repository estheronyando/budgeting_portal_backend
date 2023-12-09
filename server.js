const express = require("express");
var cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
require("dotenv").config({ path: "./config/.env" });

require("./config/DBConnection.js");
const useRouter = require("./routes/router");
const cors=require('cors')
const app = express();

//app uses
app.use(cors({credentials: true, origin:'http://localhost:3000'}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/api", useRouter);

app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','http://localhost:3000');
  res.header('Access-Control-Allow-Headers','Origin,X-Requested-With,Content-Type,Accept');
  res.header('Access-Control-Allow-Credentials','true');

  next();
})

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV == "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });

  const path = require("path");

  app.use(
    "/static",
    express.static(path.join(__dirname, "client", "build/static"))
  );

  app.use(
    "/manifest.json",
    express.static(path.join(__dirname, "client", "build", "manifest.json"))
  );

  app.use(
    "/favicon.ico",
    express.static(path.join(__dirname, "client", "build", "favicon.ico"))
  );

  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("/*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.listen(port, () => console.log(`Server is running at ${port}`));