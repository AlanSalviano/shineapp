import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { SHEET_NAME_APPOINTMENTS, SHEET_NAME_EMPLOYEES, SHEET_NAME_FRANCHISES, SHEET_NAME_USERS, SHEET_NAME_ROLES } from '../configs/sheets-config.js';
import { excelDateToYYYYMMDD } from '../utils.js';

dotenv.config();

const serviceAccountAuth = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const SPREADSHEET_ID_APPOINTMENTS = process.env.SHEET_ID_APPOINTMENTS;
const SPREADSHEET_ID_DATA = process.env.SHEET_ID_DATA;
const SPREADSHEET_ID_USERS = process.env.SHEET_ID;

async function getSheet(docId, sheetName) {
    const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
        throw new Error(`Planilha "${sheetName}" não encontrada.`);
    }
    return sheet;
}

export async function fetchRoles() {
    const sheet = await getSheet(SPREADSHEET_ID_USERS, SHEET_NAME_ROLES);
    const rows = await sheet.getRows();
    return rows.map(row => row._rawData[0]).filter(Boolean);
}

export async function loginUser(role, email, password) {
    const sheet = await getSheet(SPREADSHEET_ID_USERS, SHEET_NAME_USERS);
    const rows = await sheet.getRows();
    const user = rows.find(row => 
        row._rawData[0]?.trim().toLowerCase() === role.trim().toLowerCase() &&
        row._rawData[1]?.trim().toLowerCase() === email.trim().toLowerCase() &&
        row._rawData[2]?.trim() === password.trim()
    );
    return user;
}

export async function registerUser(role, user, email, password) {
    const sheet = await getSheet(SPREADSHEET_ID_USERS, SHEET_NAME_USERS);
    const rows = await sheet.getRows();
    const userExists = rows.some(row => row.email === email || row.user === user);
    if (userExists) {
        throw new Error('Este e-mail ou usuário já está registrado.');
    }
    await sheet.addRow({ role, user, email, password });
}

export async function fetchCustomersData() {
    const sheet = await getSheet(SPREADSHEET_ID_APPOINTMENTS, SHEET_NAME_APPOINTMENTS);
    const rows = await sheet.getRows();
    const headerRow = sheet.headerValues;
    const headersToIndex = Object.fromEntries(headerRow.map((header, index) => [header, index]));
    
    return rows.map(row => {
        const getCellValue = (header) => {
            const index = headersToIndex[header];
            return index !== undefined && row._rawData.length > index ? row._rawData[index] : '';
        };

        return {
            sheetRowNumber: row.rowNumber,
            type: getCellValue('Type'),
            date: excelDateToYYYYMMDD(getCellValue('Date')),
            pets: getCellValue('Pets'),
            closer1: getCellValue('Closer (1)'),
            closer2: getCellValue('Closer (2)'),
            customers: getCellValue('Customers'),
            phone: getCellValue('Phone'),
            oldNew: getCellValue('Old/New'),
            appointmentDate: excelDateToYYYYMMDD(getCellValue('Date (Appointment)')),
            serviceValue: getCellValue('Service Value'),
            franchise: getCellValue('Franchise'),
            city: getCellValue('City'),
            source: getCellValue('Source'),
            week: getCellValue('Week'),
            month: getCellValue('Month'),
            year: getCellValue('Year'),
            code: getCellValue('Code'),
            reminderDate: excelDateToYYYYMMDD(getCellValue('Reminder Date')),
            technician: getCellValue('Technician'),
            petShowed: getCellValue('Pet Showed'),
            serviceShowed: getCellValue('Service Showed'),
            tips: getCellValue('Tips'),
            paymentMethod: getCellValue('Method'),
            verification: getCellValue('Verification'),
        };
    });
}

export async function fetchDashboardData() {
    const sheetAppointments = await getSheet(SPREADSHEET_ID_APPOINTMENTS, SHEET_NAME_APPOINTMENTS);
    await sheetAppointments.loadCells('B1:E' + sheetAppointments.rowCount);
    const appointments = [];
    for (let i = 1; i < sheetAppointments.rowCount; i++) {
        const dateCell = sheetAppointments.getCell(i, 1);
        const petsCell = sheetAppointments.getCell(i, 2);
        const closer1Cell = sheetAppointments.getCell(i, 3);
        const closer2Cell = sheetAppointments.getCell(i, 4);
        if (dateCell.value) {
            appointments.push({ 
                date: excelDateToYYYYMMDD(dateCell.value),
                pets: petsCell.value,
                closer1: closer1Cell.value,
                closer2: closer2Cell.value
            });
        }
    }

    const sheetEmployees = await getSheet(SPREADSHEET_ID_DATA, SHEET_NAME_EMPLOYEES);
    const employees = (await sheetEmployees.getRows()).map(row => row._rawData[0]).filter(Boolean);

    const sheetFranchises = await getSheet(SPREADSHEET_ID_DATA, SHEET_NAME_FRANCHISES);
    const franchises = (await sheetFranchises.getRows()).map(row => row._rawData[0]).filter(Boolean);

    return { appointments, employees, franchises };
}

export async function registerAppointment(data) {
    const sheet = await getSheet(SPREADSHEET_ID_APPOINTMENTS, SHEET_NAME_APPOINTMENTS);
    await sheet.addRow(data);
}

export async function updateAppointment(rowIndex, updates) {
    const sheet = await getSheet(SPREADSHEET_ID_APPOINTMENTS, SHEET_NAME_APPOINTMENTS);
    await sheet.loadHeaderRow();
    const headersToIndex = Object.fromEntries(sheet.headerValues.map((header, index) => [header, index]));
    await sheet.loadCells(`A${rowIndex}:Z${rowIndex}`);
    
    sheet.getCell(rowIndex - 1, headersToIndex['Technician']).value = updates.technician;
    sheet.getCell(rowIndex - 1, headersToIndex['Pet Showed']).value = updates.petShowed;
    sheet.getCell(rowIndex - 1, headersToIndex['Service Showed']).value = updates.serviceShowed;
    sheet.getCell(rowIndex - 1, headersToIndex['Tips']).value = updates.tips;
    sheet.getCell(rowIndex - 1, headersToIndex['Method']).value = updates.paymentMethod;
    sheet.getCell(rowIndex - 1, headersToIndex['Verification']).value = updates.verification;
    
    await sheet.saveUpdatedCells();
}
