const express = require('express');
const router = express.Router();
const Demand = require('../models/demand');
const Account = require('../models/account');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

//GET AllDemands returns all demands specific to the user (User or Admin)
router.get('/getAll/:id/:token', getAccount, async (req, res) => {
    const account = res.account;
    const courrielCompte = account.Courriel;
    let demands;
    let openDemand;

    const { id, token } = req.params;

    if (id != res.account._id) {
        res.send('Invalid id');
    }

    const secret = process.env.JWT_SECRET + res.account.Password;

    try {
        jwt.verify(token, secret);
        if (account.TypeDeCompte == "usager") {
            demands = await getDemandsForUser(courrielCompte, openDemand);
        } else if (account.TypeDeCompte == "admin") {
            demands = await getDemandsForAdmin(openDemand);
        }
        res.json(demands);
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ message: err.message });
    }
});

//Get OneDemand with id
router.get('/getDemandById/:demandNumber/:id/:token', getDemand, async (req, res) => {
    res.json(res.demand);
})

//GET demands with filter (open or closed) by descending order.
router.get('/getDemandsWithFilter/:id', getAccount, async (req, res) => {
    try {
        const account = res.account;
        const courrielCompte = account.Courriel;
        let filter = req.body.selectedFilter
        let openDemand = null;
        let demands;

        if (filter == "open") {
            openDemand = true;
        } else if (filter == "closed") {
            openDemand = false;
        }

        if (account.TypeDeCompte == "usager") {
            demands = await getDemandsForUser(courrielCompte, openDemand);
        } else if (account.TypeDeCompte == "admin") {
            demands = await getDemandsForAdmin(openDemand);
        }
        res.json(demands);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
})

//Insert demand
router.post('/post/:id/:token', getAccount, async (req, res) => {

    const lastDemandId = await getLastDemandNumber();
    const demand = new Demand({
        "NumeroDeDemande": lastDemandId + 1, //Doit etre auto incrementes
        "Etude": req.body.etude,
        "Profession": req.body.profession,
        "Statut": req.body.statut,
        "Pays": req.body.pays,
        "Ville": req.body.ville,
        "Telephone": req.body.telephone,
        "DateDeNaissance": req.body.dateNaissance,
        "Description": req.body.description,
        "Communication": req.body.communication,
        "Courriel": res.account.Courriel,
        "NumeroDeConfirmation": lastDemandId + 1
        // "NumeroDeConfirmation": req.body.numeroDeConfirmation //Doit être le numero de confirmation reel.
    })

    try {
        //token verification 
        const { id, token } = req.params;
        if (id != res.account._id) {
            res.send('Invalid id');
        }

        const secret = process.env.JWT_SECRET + res.account.Password;
        jwt.verify(token, secret);

        //Adding demand to databse
        const newDemand = await demand.save();

        //Notify admin with mail
        const name = res.account.Nom + " " + res.account.Prenom;
        const email = process.env.ADMIN_EMAIL;
        const subject = "Nouvelle demande de consultation";
        const message =
            `<p>NumeroDeDemande: ${lastDemandId} <br> 
            Etude: ${req.body.etude} <br>  
            Profession: ${req.body.profession} <br>  
            Statut: ${req.body.statut} <br>  
            Pays: ${req.body.pays} <br>  
            Ville: ${req.body.ville} <br>  
            Telephone: ${req.body.telephone} <br>  
            DateDeNaissance: ${req.body.dateNaissance} <br>  
            Description: ${req.body.description} <br>  
            Communication: ${req.body.communication} <br>  
            Courriel: ${res.account.Courriel} <br> 
            </p>`;
        //  "NumeroDeConfirmation: " `${req.body.numeroDeConfirmation}`  //Doit être le numero de confirmation reel.;
        sendEmail(name, email, subject, message);
        res.status(201).json(newDemand);
    } catch (err) {
        console.error('Error saving demand:', err);
        // Handle the save error accordingly, e.g., send an error response
        res.status(500).json({ error: 'Error saving demand' });
    }
})

//Update demands status (open or closed)    
router.patch('/updateDemandStatus/:id/', getDemand, async (req, res) => {
    let newDemandStatus = req.body.statutDeDemande;
    if (newDemandStatus != null) {
        try {
            res.demand.StatutDeDemande = newDemandStatus;
            const updatedDemand = await res.demand.save()
            res.json(updatedDemand)

        } catch (err) {
            console.error('Error updating status of demand:', err);
            res.status(500).json({ err: 'Error updating demand status' });
        }
    }
})


//===========================================================================


//Middleware Functions
//Returns one account using account id
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

//Returns one Demand using demand id
async function getDemand(req, res, next) {
    let demand;

    try {
        demand = await Demand.find({NumeroDeDemande: req.params.demandNumber})
        if (demand == null) {
            return res.status(404).json({ message: 'demande introuvable' })
        }
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
    res.demand = demand;
    next();
}

//Returns last demandNumber inserted in database
function getLastDemandNumber() {
    return new Promise(async (resolve, reject) => {
        let lastDemandId;
        try {
            const lastDemand = await Demand.find({}, { NumeroDeDemande: 1, _id: 0 }).sort({ NumeroDeDemande: -1 }).limit(1);
            if (lastDemand.length === 0) {
                lastDemandId = 0;
            } else {
                lastDemandId = lastDemand[0].NumeroDeDemande;
                console.log(lastDemandId);
            }
            resolve(lastDemandId);
        } catch (err) {
            reject({ status: 500, message: err.message });
        }
    });
}

// Promise based structures 
//  Filters and Returns demands specific to a user in descending order. 
function getDemandsForUser(courrielCompte, openDemand) {
    return new Promise(async (resolve, reject) => {
        let demands;
        let parametre = { "Courriel": courrielCompte };

        try {
            if (openDemand != null) {
                parametre = { "Courriel": courrielCompte, "StatutDeDemande": openDemand };
            }
            demands = await Demand.find(parametre).sort({ "Date": -1 });
            if (demands == null || demands.length === 0) {
                return reject({ status: 200, message: 'Aucune demande trouvée' });
            }
            resolve(demands);
        } catch (err) {
            reject({ status: 500, message: err.message });
        }
    });
}

// Filters and returns demands specific to a admin in descending order.
function getDemandsForAdmin(openDemand) {
    return new Promise(async (resolve, reject) => {
        let demands;

        if (openDemand != null) {
            var parametre = { "StatutDeDemande": openDemand };
        }
        try {
            demands = await Demand.find(parametre).sort({ "Date": -1 });
            if (demands == null || demands.length === 0) {
                return reject({ status: 404, message: 'Aucune demande trouvée' });
            }
            resolve(demands);
        } catch (err) {
            reject({ status: 500, message: err.message });
        }
    });
}

// Fonction permettant l'envoie de courriel
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
