const express = require('express');
const router = express.Router();
const Bug = require('../models/bug')
            
var Num = 0;

//GET All Bugs
router.get('/getAll', async (req, res) => {
    try {
        const bugs = await Bug.find();
        res.json(bugs);
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
})

//Post Bug 
router.post('/post', async (req, res) => {
    Num = Num + 1;
    const bug = new Bug({
        NumeroDeBug: Num, 
        Titre: req.body.titre,
        Description: req.body.description,
        Courriel: req.body.courriel,
    })
    try {
        const newBug = await bug.save();
        res.status(201).json(newBug);
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

/*//DELETE Account //USED for account suppression
router.delete('/:id', getAccount, async (req, res) => {
    try {
        await res.account.deleteOne();
        res.json({ message: 'Compte supprimer' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}) */

module.exports = router