const express = require('express');
const router = express.Router();
const Account = require('../models/account')
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt'); //Password crypter
const saltRounds = 10; //Intensity of crypting


//GET Accounts    ---Fonctionnel
router.get('/getAll', async (req, res) => {
    try {
        const accounts = await Account.find();
        res.json(accounts);
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
});

//GET verifyAccounts   ---Fonctionnel
router.post('/verify', verifyUser, async (req, res) => {
    try {
        if (res.userFound && res.userFound.userFound && res.account.account != null) {
            // User is found and authenticated
            res.status(200).json({ isAuthenticated: true, account: res.account });
        } else {
            // User not found or authentication failed
            res.status(403).json({ isAuthenticated: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

//POST addNewAccount   ---Fonctionnel  à optimiser
router.post('/post', async (req, res) => {
    try {
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

//GET oneAccountById 
router.get('/:id', getAccount, (req, res) => {
    res.json(res.account);
});

//Update Password  
router.patch('/update/:id', getAccount, async (req, res) => {
    const plainText = req.body.password

    if (req.body.password != null) {
        try {
            //Hash the new password
            const hashkey = await cryptPassword(plainText)

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
//Delete oneAccount
router.delete('/:id', getAccount, async (req, res) => {
    try {
        await res.account.deleteOne();
        res.json({ message: 'Compte supprimer' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


//Send email 
router.post("/contact", (req, res) => {


    
    var url = `<a href="https://localhost:3000/"> Veuillez appuyer ici - réintialisation mot de passe </a>`
    sendLinkToEmail("Mohamed kachach","moh-kach@hotmail.com", "Reintialiser votre mot de passe", `<p> Appuyez sur ce lien pour reinitialiser votre mot de passe <br> <br> ${url}</p>`)
});

//==========================================================================
//Méthode crypte un mot de passe   --fonctionnel
async function cryptPassword(plaintextPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(plaintextPassword, saltRounds, function (err, hash) {
            if (err) {
                console.error('Error hashing password:', err);
                reject(err);
            } else {
                // Store the 'hash' in your database
                resolve(hash);
            }
        });
    });
}

//============================================================================
//Middleware function 
//Méthode retourne un compte  --fonctionnel
async function getAccount(req, res, next) {
    let account;
    try {
        account = await Account.findById(req.params.id)
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
    let passwordFound = false;
    let userFound = false;

    try {
        const accounts = await Account.find();

        for (let i = 0; i < accounts.length && !userFound; i++) {
            const result = await bcrypt.compare(req.body.password, accounts[i].Password)

            if (result) {
                passwordFound = true;
            }

            if (accounts[i].Courriel === req.body.courriel && passwordFound) {
                userFound = true;
                rightAccount = accounts[i];
            }
        }

        if (!userFound) {
            throw new Error('Utilisateur non trouvé')
        } else {
            res.userFound = { "userFound": userFound };
            res.account = { "account": rightAccount }
            next();
        }

    } catch (err) {
        console.log(err);
        res.status(403).send("Erreur de connexion")
    }
}

//SendEmail permet d'envoyer a un usager un courriel -- Fonctionnel 
 function sendLinkToEmail(name,sendTo, subject, message) {
    
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