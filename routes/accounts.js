const express = require('express');
const router = express.Router();
const Account = require('../models/account')
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
    try {
        var rightAccount;
        const accounts = await Account.find();
        var passwordFound = false;
        var userFound = false;
        console.log(req.body.courriel);
        console.log(req.body.password);
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
module.exports = router