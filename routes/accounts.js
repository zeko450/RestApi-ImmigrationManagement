const express = require('express');
const router = express.Router();
const Account = require('../models/account')
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt'); //Password crypter
const saltRounds = 10; //Intensity of crypting
const { validationResult } = require('express-validator');

//GET Accounts    ---Fonctionnel
router.get('/getAll', async (req, res) => {
    try {
        const accounts = await fetchAccounts();
        res.json(accounts);
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
});

//GET oneAccountById  -- Fonctionnel
router.get('/:id', getAccount, (req, res) => {
    res.json(res.account);
});

//GET verifyAccounts   ---Fonctionnel
router.post('/verify', verifyUser, async (req, res) => {
    const email = res.account.account.Courriel;
    const id = res.account.account._id;
    const password = res.account.account.Password;
    
    try {
        if (res.userFound && res.userFound.userFound && res.account.account != null) {

            //Generate a unique token that last 60 min
            const secret = process.env.JWT_SECRET + password;
            const payload = {
                email: email,
                id: id
            }

            const token = jwt.sign(payload, secret, { expiresIn: '60m' })
            // User is found and authenticated
            res.status(200).json({ isAuthenticated: true, account: res.account, token: token });
        } else {
            // User not found or authentication failed
            res.status(403).json({ isAuthenticated: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

//POST addNewAccount   ---Fonctionnel 
router.post('/post', async (req, res) => {
    try {

        // Input validation 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        //Separate validation logic from main route handler

        const plaintextPassword = req.body.password;

        const hashkey = await cryptPassword(plaintextPassword);

        const account = new Account({
            Nom: req.body.nom,
            Prenom: req.body.prenom,
            Courriel: req.body.courriel,
            Password: hashkey
        })
        // Save the account after hash key is generated
        const newAccount = await account.save();

        // Respond with the newly created account
        res.status(201).json(newAccount);
    }
    catch (saveError) {
        console.error('Error saving account:', saveError);
        // Handle the save error accordingly, e.g., send an error response
        res.status(500).json({ error: 'Error saving account' });
    };
});

//Verify le courriel saisi et envoie un courriel a celui-ci -- Fonctionnel
router.post('/getEmail', checkEmailExist, async (req, res) => {
    let id = res.account.account._id
    let email = res.account.account.Courriel
    let password = res.account.account.Password
    let name = res.account.account.Nom
    const subject = "Reintialiser votre mot de passe";
    let message = "";

    try {
        if (res.userFound && res.userFound.userFound && res.account.account != null) {
            // Email is found 
            res.status(200).json({ isFound: true, password: password });
        } else {
            // User not found or authentication failed
            res.status(403).json({ isFound: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }

    //Generate a unique token that last 15 minutes
    const secret = process.env.JWT_SECRET + password;
    const payload = {
        email: email,
        id: id
    }

    const token = jwt.sign(payload, secret, { expiresIn: '15m' })
    //const url = `http://localhost:4200/reinitialisation/nouveau/${id}`
    const url = `http://localhost:4200/reset-password/${id}/${token}`;
    message =
        `<p> Appuyez sur ce lien pour reinitialiser votre mot de passe </p> 
    <br> <br> 
    <a href="${url}"> ${url} </a>`

    //Send link to user email
    sendEmail(name, email, subject, message)
})

//Redirection vers la page de reinitiliation -- Fonctionnel
router.get('/reset-password/:id/:token', getAccount, async (req, res) => {
    const { id, token } = req.params;

    //Check if id exist in database
    if (id != res.account._id) {
        res.send('Invalid id');
    }

    // we have a valid id and valid user with this id
    const secret = process.env.JWT_SECRET + res.account.Password;
    try {
        console.log("Before verify")
        const payload = jwt.verify(token, secret);
        console.log("After verify")
        res.status(200).json({ isAllowed: true, courriel: res.account.Courriel })

    } catch (err) {
        res.status(999).json({ isAllowed: false });
        //console.log(err.message);
    }
})

//Update Password -- Fonctionnel  
/* router.patch('/update/:id', getAccount, async (req, res) => {
    const newPlainTextPassword = req.body.password
    if (newPlainTextPassword != null) {
        try {
            //Hash the new password
            const hashkey = await cryptPassword(newPlainTextPassword)

            res.account.Password = hashkey;

            const updatedAccount = await res.account.save()
            res.json(updatedAccount)

        } catch (err) {
            console.error('Error updating account password:', error);
            res.status(500).json({ error: 'Error updating account password' });
        }
    } else {
        // Handle case where req.body.Password is null
        res.status(400).json({ error: 'New password is required for update' });
    }
}); */

router.post('/reset-password/:id/:token', getAccount, async (req, res) => {
    const newPlainTextPassword = req.body.password
    if (newPlainTextPassword != null) {
        try {
            //Hash the new password
            const hashkey = await cryptPassword(newPlainTextPassword)

            res.account.Password = hashkey;

            const updatedAccount = await res.account.save()
            res.json(updatedAccount)

        } catch (err) {
            console.error('Error updating account password:', error);
            res.status(500).json({ error: 'Error updating account password' });
        }
    } else {
        // Handle case where req.body.Password is null
        res.status(400).json({ error: 'New password is required for update' });
    }
});

//Delete oneAccount -- Fonctionnel.
router.delete('/:id', getAccount, async (req, res) => {
    try {
        await res.account.deleteOne();
        res.json({ message: 'Compte supprimer' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
});

router.get('/logout', async (req, res) => {
    jwt.sign('', {expiresIn: '1'});
});
//==========================================================================
 

//Méthode crypte un mot de passe   --fonctionnel
async function cryptPassword(plaintextPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(plaintextPassword, saltRounds, function (err, hash) {
            if (err) {
                console.error('Error hashing password:', err);
                reject(new Error('Error hashing password'));
            } else {
                // Store the 'hash's in your database
                resolve(hash);
            }
        });
    });
}

//Méthode retourne un compte  --fonctionnel
async function getAccount(req, res, next) {
    let account;
    try {
        account = await fetchAccountById(req.params.id);
        if (account == null) {
            return res.status(404).json({ message: 'Compte introuvable' })
        }
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
    res.account = account;
    next();
}

//Methode authentifie un utilisateur et retourne une booleene --fonctionnel
async function verifyUser(req, res, next) {
    let rightAccount;
    let userFound = false;

    try {
        const accounts = await fetchAccounts();

        for (let i = 0; i < accounts.length && !userFound; i++) {
            // Use bcrypt.compare to compare the entered password with the hashed password
            const isPasswordMatch = await comparePasswords(req.body.password, accounts[i].Password);

            if (req.body.courriel === accounts[i].Courriel && isPasswordMatch) {
                userFound = true;
                rightAccount = accounts[i];
            }
        }

        if (!userFound) {
            throw new Error('Utilisateur non trouvé');
        } else {
            res.userFound = { "userFound": userFound };
            res.account = { "account": rightAccount };
            next();
        }

    } catch (err) {
        console.error(err);
        res.status(404).send("L'utilisateur n'existe pas");
    }

}

//Verify si un courriel existe 
async function checkEmailExist(req, res, next) {
    let rightAccount;
    let userFound = false;
    try {
        const accounts = await fetchAccounts();
        for (let i = 0; i < accounts.length && !userFound; i++) {
            if (accounts[i].Courriel === req.body.email) {
                userFound = true;
                rightAccount = accounts[i]
                console.log(userFound);
            }
        }
        if (!userFound) {
            throw new Error("Ce compte n'existe pas")
        } else {
            res.userFound = { "userFound": userFound };
            res.account = { "account": rightAccount }
            next();
        }
    } catch (err) {
        console.log("err" + userFound);
        console.log(err);
        res.status(403).send("Erreur de connexion")
    }
}

//Retourne la liste de compte
async function fetchAccounts() {
    // Logic to fetch accounts from the database
    try {
        // Logic to fetch accounts from the database
        return await Account.find();
    } catch (error) {
        console.error("Error fetching accounts:", error);
        throw new Error("Error fetching accounts");
    }
}

//Compare le mot de passe saisie et le mot de passe stocké dans la base de donnée
async function comparePasswords(enteredPassword, storedPassword) {
    return await bcrypt.compare(enteredPassword, storedPassword);
}

//Retourne un compte en fonction de l'id fournis.
async function fetchAccountById(params) {
    try {
        return await Account.findById(params);
    } catch (error) {
        console.error("Error fetching account:", error);
        throw new Error("Error fetching account");
    }
}

//Fonction permettant l'envoie de courriel.
function sendEmail(name, sendTo, subject, message) {

    const mail = {
        from: name,
        to: sendTo,
        subject: subject,
        html: message
    };

    const contactEmail = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAILSERVER_EMAIL,
            pass: process.env.MAILSERVER_PASSWORD
        },
    });

    contactEmail.verify((error) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Ready to Send");
        }
    });

    contactEmail.sendMail(mail, (error) => {
        if (error) {
            res.json(error);
        } else {
            res.json({ code: 200, status: "Message Sent" });
        }
    });
}

module.exports = router