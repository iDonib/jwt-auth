require('dotenv').config();
require('./config/database').connect();
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const auth = require("./middleware/auth")
const User = require('./model/user')

const express = require('express')

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hey folks")
})

app.post("/register", async (req, res) => {
    //registration logic
    try {
        const { first_name, last_name, email, password } = req.body;

        if(!(email && password && first_name && last_name)) {
            res.status(400).send("All inputs are required!")
        }

        const oldUser = await User.findOne({email});

        if(oldUser){
            return res.status(409).send("User already exist. Please login...")
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            first_name,
            last_name,
            email: email.toLowerCase(),
            password: encryptedPassword,
        });

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: '2h',
            }
        );

        user.token = token;

        res.status(201).json(user);

    } catch (error) {
        console.log(error)
    }
})

app.post("/login", async (req,res) => {
    //login logic
    try {
        const { email, password } = req.body;

        if(!(email && password)) {
            res.status(400).send("Enter both email and password!")
        }

        const user = await User.findOne({email});

        if(user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: '2h',
                }
            );

            user.token = token;

            res.status(200).json(user);
        }
        res.status(400).send("invalid credentials")
    } catch (error) {
        console.log(error);        
    }
});


app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome!");
});

// app.use("*", (req, res) => {
//     res.status(404).json({
//       success: "false",
//       message: "Page not found",
//       error: {
//         statusCode: 404,
//         message: "You reached a route that is not defined on this server",
//       },
//     });
// });

module.exports = app;