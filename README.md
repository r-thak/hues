# Hues
A digital implementation of the popular board game [Hues and Cues](https://theop.games/products/hues-and-cues). My instance is available [here](https://hues.rthak.com) when it's running. Supports online Multiplayer only. Supports mobile users.

## How to Run
Installation:
```bash
git clone https://github.com/r-thak/hues
cd hues
npm install
```
Running Locally:
```bash
npm start
```

This will run both the WebSocket and Client application on port 3000. Open `http://localhost:3000` to test locally. To play with others, you can try connecting over the same local network using your device's private IP address (e.g. `http://<private-ip-address>:3000`) OR you can use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet. If you want to do a more permanent deployment, you should be able to figure it out pretty easily.
