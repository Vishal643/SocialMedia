const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator'); //require('express-validator/check'); this can also be used which is old method
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');



//@route  POST api/users
//@desc   Regester users
//@access Public
router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please include a valid email')
        .isEmail(),
    check('password', 'Please enter a password with minimum 6 characters long')
        .isLength({ min: 6 })
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // console.log(req.body)
        const { name, email, password } = req.body;


        try {

            //See if the user exists

            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
            }

            //Get users gravatar

            const avatar = gravatar.url(email, {
                s: '200',   // default size
                r: 'pg',    //rating pg=no vulger image
                d: 'mm'     // default image
            })

            user = new User({
                name,
                email,
                avatar,
                password
            });

            //Encrypt password

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            //Return Json Webtocken
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    });


module.exports = router;