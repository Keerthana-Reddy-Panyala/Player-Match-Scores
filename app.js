const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
    player_id AS playerId,player_name AS playerName
    FROM
    player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
    *
    FROM
    player_details
    WHERE
    player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name='${playerName}'
    WHERE
    player_id=${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    match_id AS matchId,match,year
    FROM
    match_details
    WHERE
    match_id=${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT
    match_id as matchId,match,year
    FROM
    match_details NATURAL JOIN player_match_score
    WHERE
    player_id=${playerId};`;
  const matchesArray = await db.all(getMatchesQuery);
  response.send(matchesArray);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT
    player_id as playerId,player_name as playerName
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE
    match_id=${matchId};`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
    SELECT
    player_id as playerId,player_name as playerName,SUM(score) as totalScore,SUM(fours) as totalFours,SUM(sixes) as totalSixes
    FROM
    player_details NATURAL JOIN player_match_score
    WHERE
    player_id=${playerId};`;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

module.exports = app;
