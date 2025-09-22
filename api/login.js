import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { SHEET_NAME_USERS } from './configs/sheets-config.js';

dotenv.config();

const serviceAccountAuth = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { role, email, password } = req.body;

    console.log('Received data:', { role, email, password });

    if (!role || !email || !password) {
        console.error('Validation Error: Role, email, or password is missing.');
        return res.status(400).json({ success: false, message: 'Role, email and password are required.' });
    }

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[SHEET_NAME_USERS];
        if (!sheet) {
            console.error('Spreadsheet Error: "Users" sheet not found.');
            return res.status(500).json({ success: false, message: `Spreadsheet "${SHEET_NAME_USERS}" not found.` });
        }

        const rows = await sheet.getRows();

        console.log('Fetched rows from sheet:', rows.map(row => ({
            role: row._rawData[0],
            email: row._rawData[1],
            password: row._rawData[2]
        })));

        const user = rows.find(row => {
            const rowRole = row._rawData[0] || '';
            const rowEmail = row._rawData[1] || '';
            const rowPassword = row._rawData[2] || '';

            console.log(`Comparing: Role "${role}" vs "${rowRole}", Email "${email}" vs "${rowEmail}", Password "${password}" vs "${rowPassword}"`);

            return rowRole.trim().toLowerCase() === role.trim().toLowerCase() &&
                   rowEmail.trim().toLowerCase() === email.trim().toLowerCase() &&
                   rowPassword.trim() === password.trim();
        });


        if (user) {
            console.log('Login successful for user:', email);
            const redirectUrl = "appointments.html";
            return res.status(200).json({ success: true, message: 'Login successful!', redirectUrl });
        } else {
            console.log('Login failed: Invalid credentials.');
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error('Error processing login:', error);
        return res.status(500).json({ success: false, message: 'An error occurred on the server. Please try again.' });
    }
}
