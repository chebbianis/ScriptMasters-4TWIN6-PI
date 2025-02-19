import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const port = 3000;

const httpServer = http.createServer(app);

const io = new Server(httpServer);

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

const router = express.Router();

const DB_URI = "mongodb://localhost:27017/ScriptMasters";

mongoose.connect(DB_URI).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log(err);
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});

router.get("/test", (req, res) => {
    res.json({
        message: "API connectée avec succès",
        timestamp: new Date().toISOString()
    });
});

app.use(router);
