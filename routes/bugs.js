const express = require('express');
const router = express.Router();
const Bug = require('../models/bug')

var Num = 0;

//GET All Bugs
router.get('/getAll', async (req, res) => {
    try {
        const bugs = await Bug.find({ "StatutDeBug": true }).sort({ "Date": -1 });
        res.json(bugs);
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
});

//Post Bug 
router.post('/post', async (req, res) => {
    Num = Num + 1;
    const bug = new Bug({
        NumeroDeBug: Num,
        Titre: req.body.titre,
        Description: req.body.description,
        Courriel: req.body.courriel,
        StatutDeBug: req.body.statutDeBug
    });
    try {
        const newBug = await bug.save();
        res.status(201).json(newBug);
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
});

//Update bug status
router.patch('/updateBugStatus/:id', getBug, async (req, res) => {
    let newBugStatus = req.body.statutDeBug;
    console.log("New status value " + newBugStatus);
    if (newBugStatus != null) {
        try {
            res.bug.StatutDeBug = newBugStatus;
            console.log("Bug before save" + res.bug);
            const updatedBug = await res.bug.save();
            console.log("Bug after save" + updatedBug);

            res.json(updatedBug);
        } catch (err) {
            console.error('Error updating status of bug' + err);
            res.status(500).json({ err: "Error updating bug status" })
        }
    }
});

//======================================================
//Middleware function 
async function getBug(req, res, next) {
    let bug;
    try {
        bug = await Bug.findById(req.params.id);
        if (bug == null) {
            return res.status(404).json({ message: "Bug not found" });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
    res.bug = bug;
    next();
}

module.exports = router