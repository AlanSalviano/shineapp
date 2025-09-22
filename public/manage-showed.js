// public/manage-showed.js

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('showed-table-body');
    const totalPetsShowedCount = document.getElementById('totalPetsShowedCount');
    const totalServiceShowed = document.getElementById('totalServiceShowed');
    const totalTips = document.getElementById('totalTips');
    const totalCustomersCount = document.getElementById('totalCustomersCount');

    const customersFilter = document.getElementById('customers-filter');
    const codeFilter = document.getElementById('code-filter');
    const startDateFilter = document.getElementById('start-date-filter');
    const endDateFilter = document.getElementById('end-date-filter');
    const technicianFilter = document.getElementById('technician-filter');
    const verificationFilter = document.getElementById('verification-filter');

    let allAppointmentsData = [];

    // Opções para os dropdowns
    const petOptions = Array.from({ length: 10 }, (_, i) => i + 1);
    const paymentOptions = ["Check", "American Express", "Apple Pay", "Discover", "Master Card", "Visa", "Zelle", "Cash", "Invoice"];
    const verificationOptions = ["Showed", "Canceled"];

    // Função auxiliar para popular dropdowns
    function populateDropdown(selectElement, items) {
        if (items && Array.isArray(items)) {
            // Adiciona a opção "All" ou "Select"
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = selectElement.id === 'technician-filter' ? 'All Technicians' : 'All Verifications';
            selectElement.appendChild(defaultOption);
            
            // Adiciona as demais opções
            items.forEach(item => {
                if (item) {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    selectElement.appendChild(option);
                }
            });
        }
    }

    // Função para renderizar a tabela e atualizar os cards
    function renderTableAndCards(data) {
        tableBody.innerHTML = '';
        
        let totalPets = 0;
        let totalServiceValue = 0;
        let totalTipsValue = 0;
        let totalCustomers = data.length;

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" class="p-4 text-center text-muted-foreground">Nenhum agendamento encontrado.</td></tr>';
        } else {
            data.forEach((appointment) => {
                const row = document.createElement('tr');
                row.classList.add('border-b', 'border-border', 'hover:bg-muted/50', 'transition-colors');

                const petShowed = parseInt(appointment.petShowed, 10) || 0;
                const serviceValue = parseFloat(appointment.serviceShowed) || 0;
                const tipsValue = parseFloat(appointment.tips) || 0;

                totalPets += petShowed;
                totalServiceValue += serviceValue;
                totalTipsValue += tipsValue;

                row.innerHTML = `
                    <td class="p-4">${appointment.date}</td>
                    <td class="p-4">${appointment.customers}</td>
                    <td class="p-4 code-cell">${appointment.code}</td>
                    <td class="p-4"><input type="text" value="${appointment.technician || ''}" style="width: 100px;" class="bg-transparent border border-border rounded-md px-2"></td>
                    <td class="p-4">
                        <select style="width: 60px;" class="bg-transparent border border-border rounded-md px-2">
                            <option value="">Pets...</option>
                            ${petOptions.map(num => `<option value="${num}" ${appointment.petShowed === String(num) ? 'selected' : ''}>${num}</option>`).join('')}
                        </select>
                    </td>
                    <td class="p-4"><input type="text" value="${appointment.serviceShowed || ''}" style="width: 100px;" class="bg-transparent border border-border rounded-md px-2"></td>
                    <td class="p-4"><input type="text" value="${appointment.tips || ''}" style="width: 80px;" class="bg-transparent border border-border rounded-md px-2" placeholder="$0.00"></td>
                    <td class="p-4">
                        <select style="width: 120px;" class="bg-transparent border border-border rounded-md px-2">
                            <option value="">Select...</option>
                            ${paymentOptions.map(option => `<option value="${option}" ${appointment.paymentMethod === option ? 'selected' : ''}>${option}</option>`).join('')}
                        </select>
                    </td>
                    <td class="p-4">
                        <select style="width: 100px;" class="bg-transparent border border-border rounded-md px-2">
                            <option value="">Select...</option>
                            ${verificationOptions.map(option => `<option value="${option}" ${appointment.verification === option ? 'selected' : ''}>${option}</option>`).join('')}
                        </select>
                    </td>
                    <td class="p-4">
                        <button class="save-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-brand-primary text-white hover:shadow-brand" data-row-number="${appointment.sheetRowNumber}">Save</button>
                    </td>
                `;

                tableBody.appendChild(row);
            });
        }
        
        // Atualiza os cards de resumo
        totalPetsShowedCount.textContent = totalPets;
        totalServiceShowed.textContent = `R$${totalServiceValue.toFixed(2)}`;
        totalTips.textContent = `R$${totalTipsValue.toFixed(2)}`;
        totalCustomersCount.textContent = totalCustomers;
    }

    // Função para aplicar os filtros
    function applyFilters() {
        const searchTermCustomers = customersFilter.value.toLowerCase();
        const searchTermCode = codeFilter.value.toLowerCase();
        const selectedStartDate = startDateFilter.value ? new Date(startDateFilter.value) : null;
        const selectedEndDate = endDateFilter.value ? new Date(endDateFilter.value) : null;
        const selectedTechnician = technicianFilter.value.toLowerCase();
        const selectedVerification = verificationFilter.value.toLowerCase();

        const filteredData = allAppointmentsData.filter(appointment => {
            const appointmentDate = new Date(appointment.date.split('/').reverse().join('-'));

            const matchesCustomers = searchTermCustomers === '' || 
                                     (appointment.customers && appointment.customers.toLowerCase().includes(searchTermCustomers));
            
            const matchesCode = searchTermCode === '' || 
                                (appointment.code && appointment.code.toLowerCase().includes(searchTermCode));
            
            const matchesDateRange = (!selectedStartDate || appointmentDate >= selectedStartDate) &&
                                     (!selectedEndDate || appointmentDate <= selectedEndDate);
            
            const matchesTechnician = selectedTechnician === '' || 
                                      (appointment.technician && appointment.technician.toLowerCase() === selectedTechnician);
            
            const matchesVerification = selectedVerification === '' || 
                                        (appointment.verification && appointment.verification.toLowerCase() === selectedVerification);

            return matchesCustomers && matchesCode && matchesDateRange && matchesTechnician && matchesVerification;
        });

        renderTableAndCards(filteredData);
    }
    
    // Função principal para buscar os dados e renderizar a página
    async function initPage() {
        try {
            const response = await fetch('/api/get-customers-data', {
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error('Failed to load appointment data.');
            }
            const data = await response.json();
            allAppointmentsData = data.customers;

            // Popula o dropdown de técnicos com base nos dados da planilha
            const technicians = new Set();
            allAppointmentsData.forEach(appointment => {
                if (appointment.technician) technicians.add(appointment.technician);
            });
            populateDropdown(technicianFilter, [...technicians].sort());

            renderTableAndCards(allAppointmentsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = '<tr><td colspan="10" class="p-4 text-center text-red-600">Erro ao carregar dados. Tente novamente.</td></tr>';
        }
    }

    // Event listener para a ação de salvar
    tableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('save-btn')) {
            const row = event.target.closest('tr');
            const sheetRowNumber = event.target.dataset.rowNumber;

            const inputs = row.querySelectorAll('input');
            const selects = row.querySelectorAll('select');

            const rowData = {
                rowIndex: parseInt(sheetRowNumber, 10),
                technician: inputs[0].value,
                petShowed: selects[0].value,
                serviceShowed: inputs[1].value,
                tips: inputs[2].value,
                paymentMethod: selects[1].value,
                verification: selects[2].value,
            };

            try {
                const response = await fetch('/api/update-appointment-showed-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(rowData),
                });
                const result = await response.json();
                if (result.success) {
                    alert('Dados atualizados com sucesso!');
                    initPage(); // Recarrega a tabela para mostrar os dados atualizados
                } else {
                    alert(`Erro ao salvar: ${result.message}`);
                }
            } catch (error) {
                console.error('Erro na requisição da API:', error);
                alert('Erro na comunicação com o servidor. Tente novamente.');
            }
        }
    });

    // Adiciona event listeners para os novos filtros
    customersFilter.addEventListener('input', applyFilters);
    codeFilter.addEventListener('input', applyFilters);
    startDateFilter.addEventListener('change', applyFilters);
    endDateFilter.addEventListener('change', applyFilters);
    technicianFilter.addEventListener('change', applyFilters);
    verificationFilter.addEventListener('change', applyFilters);

    initPage();
});
