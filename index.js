const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const inputFilePath = `${__dirname}/input.txt`;
const outputFilePath = `${__dirname}/output.txt`;

const sleepDelay = 2500;

const authToken = process.env["AUTH_TOKEN"];

const checkGamertagForLegitimacy = async (gamertag) => {
  if (gamertag.length > 12) {
    console.log(`${gamertag} is too long`);
    return;
  }

  const config = {
    method: "post",
    url: "https://gamertag.xboxlive.com/gamertags/reserve",
    headers: {
      authorization: authToken,
      "x-xbl-contract-version": "1",
    },
    data: `{"gamertag":"${gamertag}","reservationId":"1","targetGamertagFields":"gamertag"}`,
  };

  await axios(config)
    .then(function ({ data }) {
      if (data.gamertagSuffix !== "") {
        // Gamertag allowed but already taken
        return addToOutputFile(`🟡 ${gamertag} already taken`);
      }
      // Gamertag allowed and available
      addToOutputFile(`✅ ${gamertag}`);
    })
    .catch(({ response: { data } }) => {
      // Gametag not allowed
      if (data.code === 1012) {
        return addToOutputFile(`❌ ${gamertag}`);
      }
      // Rate-limited
      if (data.limitType === "Rate") {
        console.log(
          `Being rate limited, only allowing ${data.maxequests} in ${
            data.periodInSeconds / 60
          } minutes. You/'ve done ${data.currentRequests}`,
          data
        );
        return retryableGamertags.push(gamertag);
      }

      // Some other error
      console.log(`Error checking ${gamertag}: ${!!data.description ? data.description : data}`);
      retryableGamertags.push(gamertag);
    });
};

const addToOutputFile = (message) => {
  console.log(message);
  fs.appendFileSync(outputFilePath, `\n${message}`, function (err) {
    if (err) {
      console.log(`Error appending to file: ${message}`, err);
    }
  });
};

(async () => {
  if (authToken === undefined) {
    console.error("Error: need to define AUTH_TOKEN value in .env file");
    return;
  }

  const checkThese = fs
    .readFileSync(inputFilePath, "utf8")
    .split("\n")
    .filter((gamertag) => gamertag !== "");

  if (checkThese.length === 0) {
    console.log(
      `No gamertags to check, input a line-delimited list in ${inputFilePath}`
    );
    return;
  }

  console.log(
    `Checking the availability of ${checkThese.length} gamertag${
      checkThese.length !== 1 ? "s" : ""
    }!`
  );

  await Promise.all(
    checkThese.map((gamertag, index) => {
      return new Promise((resolve, reject) => {
        try {
          setTimeout(() => {
            checkGamertagForLegitimacy(gamertag).then(() => {
              resolve();
            });
          }, index * sleepDelay);//To spread out requests to mitigate rate-limiting
        } catch (err) {
          reject(err);
        }
      });
    })
  );

  if (retryableGamertags.length > 0) {
    console.log("Note: Need to retry the following", retryableGamertags);
  }

  //Push the retryable gamertags back into the input file for subsequent reprocessing
  await fs.writeFileSync(
    inputFilePath,
    retryableGamertags.reduce((acc, gamertag, index) => {
      if (index === 0) {
        return `${acc}${gamertag}`;
      }
      return `${acc}\n${gamertag}`;
    }, "")
  );

  console.log(
    `Successfuly checked ${
      checkThese.length - retryableGamertags.length
    } gamertag${
      checkThese.length - retryableGamertags.length !== 1 ? "s" : ""
    }!`
  );
})();
