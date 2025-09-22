import { dynamicLists } from './utils.js';
import { fetchRoles, loginUser, registerUser, fetchCustomersData, fetchDashboardData, registerAppointment, updateAppointment } from './handler/sheets-handler.js';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { url, method } = req;

    try {
        if (url.startsWith('/api/get-roles') && method === 'GET') {
            const roles = await fetchRoles();
            return res.status(200).json(roles);
        }

        if (url.startsWith('/api/login') && method === 'POST') {
            const { role, email, password } = req.body;
            const user = await loginUser(role, email, password);
            if (user) {
                return res.status(200).json({ success: true, message: 'Login successful!', redirectUrl: "appointments.html" });
            } else {
                return res.status(401).json({ success: false, message: 'Invalid credentials.' });
            }
        }

        if (url.startsWith('/api/register') && method === 'POST') {
            const { role, user, email, password } = req.body;
            await registerUser(role, user, email, password);
            return res.status(201).json({ success: true, message: 'Conta criada com sucesso!' });
        }

        if (url.startsWith('/api/get-customers-data') && method === 'GET') {
            const customers = await fetchCustomersData();
            return res.status(200).json({ customers });
        }
        
        if (url.startsWith('/api/get-dashboard-data') && method === 'GET') {
            const data = await fetchDashboardData();
            return res.status(200).json(data);
        }

        if (url.startsWith('/api/register-appointment') && method === 'POST') {
            await registerAppointment(req.body);
            return res.status(201).json({ success: true, message: 'Agendamento registrado com sucesso!' });
        }
        
        if (url.startsWith('/api/update-appointment-showed-data') && method === 'POST') {
            const { rowIndex, ...updates } = req.body;
            await updateAppointment(rowIndex, updates);
            return res.status(200).json({ success: true, message: 'Dados atualizados com sucesso!' });
        }

        if (url.startsWith('/api/get-lists') && method === 'GET') {
            return res.status(200).json(dynamicLists);
        }
        
        if (url.startsWith('/api/get-google-maps-api-key') && method === 'GET') {
            const apiKey = process.env.GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                throw new Error('Chave da API do Google Maps não encontrada.');
            }
            return res.status(200).json({ apiKey });
        }
        
        if (url.startsWith('/api/get-tech-data') && method === 'GET') {
            const techDataJson = process.env.TECH_CIDADES_JSON;
            if (!techDataJson) {
                throw new Error('Variável de ambiente TECH_CIDADES_JSON não encontrada.');
            }
            const techData = JSON.parse(techDataJson);
            return res.status(200).json(techData);
        }

        return res.status(404).json({ message: 'Endpoint não encontrado.' });

    } catch (error) {
        console.error('Erro na API:', error);
        res.status(500).json({ success: false, message: error.message || 'Ocorreu um erro no servidor.' });
    }
}
