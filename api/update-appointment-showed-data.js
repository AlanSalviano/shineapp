// api/update-appointment-showed-data.js

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { SHEET_NAME_APPOINTMENTS } from './configs/sheets-config.js';

dotenv.config();

const serviceAccountAuth = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID_APPOINTMENTS = process.env.SHEET_ID_APPOINTMENTS;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { rowIndex, technician, petShowed, serviceShowed, tips, paymentMethod, verification } = req.body;
        
        console.log('--- Início do Processo de Atualização (Versão Final) ---');
        console.log('Dados recebidos do frontend para atualização:', { rowIndex, technician, petShowed, serviceShowed, tips, paymentMethod, verification });

        if (rowIndex === undefined || rowIndex < 0) {
            console.error('Validation Error: O índice da linha é inválido. Valor recebido:', rowIndex);
            return res.status(400).json({ success: false, message: 'O índice da linha é inválido.' });
        }

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID_APPOINTMENTS, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[SHEET_NAME_APPOINTMENTS];

        if (!sheet) {
            console.error(`Spreadsheet Error: Planilha "${SHEET_NAME_APPOINTMENTS}" não encontrada.`);
            return res.status(500).json({ success: false, message: `Planilha "${SHEET_NAME_APPOINTMENTS}" não encontrada.` });
        }
        
        // Carrega os cabeçalhos da linha para garantir o acesso correto aos nomes das colunas
        await sheet.loadHeaderRow();

        // Carrega todas as células da linha específica para garantir a atualização correta.
        await sheet.loadCells(`A${rowIndex}:Z${rowIndex}`);
        
        // Mapeamento dos nomes de cabeçalho para os índices de coluna.
        const headerRow = sheet.headerValues;
        const headersToIndex = {};
        headerRow.forEach((header, index) => {
            headersToIndex[header] = index;
        });

        // Obtém a célula para cada valor e a atualiza.
        const technicianCell = sheet.getCell(rowIndex - 1, headersToIndex['Technician']);
        const petShowedCell = sheet.getCell(rowIndex - 1, headersToIndex['Pet Showed']);
        const serviceShowedCell = sheet.getCell(rowIndex - 1, headersToIndex['Service Showed']);
        const tipsCell = sheet.getCell(rowIndex - 1, headersToIndex['Tips']);
        const methodCell = sheet.getCell(rowIndex - 1, headersToIndex['Method']);
        const verificationCell = sheet.getCell(rowIndex - 1, headersToIndex['Verification']);

        technicianCell.value = technician;
        petShowedCell.value = petShowed;
        serviceShowedCell.value = serviceShowed;
        tipsCell.value = tips;
        methodCell.value = paymentMethod;
        verificationCell.value = verification;

        // Salva todas as células atualizadas em uma única requisição.
        await sheet.saveUpdatedCells();

        console.log('Dados atualizados com sucesso na planilha para o índice:', rowIndex);
        console.log('--- Fim do Processo de Atualização (Versão Final) ---');
        return res.status(200).json({ success: true, message: 'Dados atualizados com sucesso!' });
    } catch (error) {
        console.error('Erro geral ao atualizar agendamento:', error);
        return res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor. Por favor, tente novamente.' });
    }
}
