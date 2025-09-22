import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { excelDateToYYYYMMDD } from './utils.js';
import { SHEET_NAME_APPOINTMENTS, SHEET_NAME_EMPLOYEES, SHEET_NAME_FRANCHISES } from './configs/sheets-config.js';

dotenv.config();

const serviceAccountAuth = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID_APPOINTMENTS = process.env.SHEET_ID_APPOINTMENTS;
const SPREADSHEET_ID_DATA = process.env.SHEET_ID_DATA;

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const docAppointments = new GoogleSpreadsheet(SPREADSHEET_ID_APPOINTMENTS, serviceAccountAuth);
        const docData = new GoogleSpreadsheet(SPREADSHEET_ID_DATA, serviceAccountAuth);

        await Promise.all([docAppointments.loadInfo(), docData.loadInfo()]);

        const sheetAppointments = docAppointments.sheetsByTitle[SHEET_NAME_APPOINTMENTS];
        const sheetEmployees = docData.sheetsByTitle[SHEET_NAME_EMPLOYEES];
        const sheetFranchises = docData.sheetsByTitle[SHEET_NAME_FRANCHISES];

        if (!sheetAppointments || !sheetEmployees || !sheetFranchises) {
            console.error('One or more sheets were not found.');
            return res.status(404).json({ error: 'Uma ou mais planilhas não foram encontradas.' });
        }

        // Fetch Appointments
        await sheetAppointments.loadCells('B1:E' + sheetAppointments.rowCount);
        const appointments = [];
        for (let i = 1; i < sheetAppointments.rowCount; i++) {
            const dateCell = sheetAppointments.getCell(i, 1);
            const petsCell = sheetAppointments.getCell(i, 2);
            const closer1Cell = sheetAppointments.getCell(i, 3);
            const closer2Cell = sheetAppointments.getCell(i, 4);

            if (dateCell.value) {
                const formattedDate = excelDateToYYYYMMDD(dateCell.value);
                appointments.push({ 
                    date: formattedDate,
                    pets: petsCell.value,
                    closer1: closer1Cell.value,
                    closer2: closer2Cell.value
                });
            }
        }

        // Fetch Employees
        await sheetEmployees.loadCells('A1:A' + sheetEmployees.rowCount);
        const employees = [];
        for (let i = 1; i < sheetEmployees.rowCount; i++) {
            const cell = sheetEmployees.getCell(i, 0);
            if (cell.value) {
                employees.push(cell.value);
            }
        }

        // Fetch Franchises
        await sheetFranchises.loadCells('A1:A' + sheetFranchises.rowCount);
        const franchises = [];
        for (let i = 1; i < sheetFranchises.rowCount; i++) {
            const cell = sheetFranchises.getCell(i, 0);
            if (cell.value) {
                franchises.push(cell.value);
            }
        }

        const responseData = {
            appointments,
            employees,
            franchises
        };

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Erro ao buscar dados do painel:', error);
        res.status(500).json({ error: 'Falha ao buscar dados do painel.' });
    }
}
