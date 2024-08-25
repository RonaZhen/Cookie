const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

app.get('/cookie', async (req, res) => {
    const { email, password } = req.query;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password in query parameters' });
    }

    const headers = {
        'authorization': 'OAuth 350685531728|62f8ce9f74b12f84c123cc23437a4a32',
        'x-fb-friendly-name': 'Authenticate',
        'x-fb-connection-type': 'Unknown',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/x-www-form-urlencoded',
        'x-fb-http-engine': 'Liger'
    };

    const data = new URLSearchParams({
        'adid': crypto.randomBytes(8).toString('hex'),
        'format': 'json',
        'device_id': uuidv4(),
        'email': email,
        'password': password,
        'generate_analytics_claims': '0',
        'credentials_type': 'password',
        'source': 'login',
        'error_detail_type': 'button_with_disabled',
        'enroll_misauth': 'false',
        'generate_session_cookies': 1,
        'generate_machine_id': '0',
        'fb_api_req_friendly_name': 'authenticate'
    });

    try {
        const response = await axios.post('https://b-graph.facebook.com/auth/login', data, { headers });
        const submit = response.data;

        if (submit.session_key) {
            res.status(200).json(submit);
        } else if (submit.error?.message.includes('www.facebook.com')) {
            res.status(403).json({ error: 'ACCOUNT IN CHECKPOINT' });
        } else if (submit.error?.message.includes('SMS')) {
            res.status(403).json({ error: '2 FACTOR AUTHENTICATION IS ENABLED. PLEASE DISABLE IT BEFORE GETTING TOKEN' });
        } else if (submit.error?.error_user_title === 'Wrong Credentials') {
            res.status(401).json({ error: 'WRONG CREDENTIALS' });
        } else if (submit.error?.error_user_title === 'Incorrect Username') {
            res.status(404).json({ error: 'ACCOUNT DOES NOT EXIST' });
        } else if (submit.error?.message.includes('limit')) {
            res.status(429).json({ error: 'REQUEST LIMIT. USE VPN OR WAIT' });
        } else if (submit.error?.message.includes('required')) {
            res.status(400).json({ error: 'PLEASE FILL IN ALL REQUIRED FIELDS' });
        } else {
            res.status(500).json({ error: submit });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
