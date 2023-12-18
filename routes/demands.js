const express = require('express');
const router = express.Router();
const Demand = require('../models/demand')
const Account = require('../models/account')


//GET AllDemands returns all demands specific to the user (User or Admin)
router.get('/getAll/:id', getAccount, async (req, res) => {
    const account = res.account;
    const courrielCompte = account.Courriel;
    let demands;
    let openDemand;

    try {
        if (account.TypeDeCompte == "usager") {
            demands = await getDemandsForUser(courrielCompte, openDemand);
        } else if (account.TypeDeCompte == "admin") {
            demands = await getDemandsForAdmin(openDemand);
        }
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
}); 

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
router.post('/post/:id', getAccount, async (req, res) => {
    const demand = new Demand({
        "NumeroDeDemande": req.body.numeroDeDemande, //Doit etre auto incrementes
        "Etude": req.body.etude,
        "Profession": req.body.profession,
        "Statut": req.body.statut,
        "Pays": req.body.pays,
        "Ville": req.body.ville,
        "Telephone": req.body.telephone,
        "DateDeNaissance": req.body.dateDeNaissance,
        "Description": req.body.description,
        "Communication": req.body.communication,
        "Courriel": res.account.Courriel,
        "NumeroDeConfirmation": req.body.numeroDeConfirmation //Doit être le numero de confirmation reel.
    })
    try {
        const newDemand = await demand.save();
        res.status(201).json(newDemand);
    } catch (err) {
        console.error('Error saving account:', err);
        // Handle the save error accordingly, e.g., send an error response
        res.status(500).json({ error: 'Error saving account' });
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

//Middleware Function
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
        demand = await Demand.findById(req.params.id)
        if (demand == null) {
            return res.status(404).json({ message: 'demande introuvable' })
        }
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
    res.demand = demand;
    next();
}
// ============================================================================
// Promise based structure 
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
                return reject({ status: 404, message: 'Aucune demande trouvée' });
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

module.exports = router
