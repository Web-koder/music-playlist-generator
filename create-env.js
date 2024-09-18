const fs = require('fs');

fs.writeFileSync('./env-config.js',
`window.ENV = {
  SPOTIFY_CLIENT_ID: '${process.env.SPOTIFY_CLIENT_ID}',
  SPOTIFY_CLIENT_SECRET: '${process.env.SPOTIFY_CLIENT_SECRET}'
};`
);