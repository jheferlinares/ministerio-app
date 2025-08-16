class MinisterioApp {
    constructor() {
        this.hermanos = [];
        this.familias = [];
        this.grupos = [];
        this.currentEditItem = null;
        this.currentEditType = null;
        this.searchTerm = '';
        this.localidadFilter = '';
        this.apiUrl = '/api/data';
        
        this.init();
        this.loadData();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        document.getElementById('addHermano').addEventListener('click', () => this.openModal('hermano'));
        document.getElementById('addFamilia').addEventListener('click', () => this.openModal('familia'));
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('localidadFilter').addEventListener('change', (e) => this.handleLocalidadFilter(e.target.value));
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal')) {
                this.closeModal();
            }
        });
    }

    openModal(type, item = null) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const input = document.getElementById('itemName');
        const localidadSelect = document.getElementById('localidadSelect');
        const companeroSelect = document.getElementById('companeroSelect');
        
        this.currentEditType = type;
        this.currentEditItem = item;
        
        if (type === 'hermano') {
            companeroSelect.style.display = 'block';
            this.updateCompaneroOptions();
        } else {
            companeroSelect.style.display = 'none';
        }
        
        if (item) {
            title.textContent = `Editar ${type === 'hermano' ? 'Hermano' : 'Familia'}`;
            input.value = item.name;
            localidadSelect.value = item.localidad || '';
            if (type === 'hermano') {
                companeroSelect.value = item.companeroId || '';
            }
        } else {
            title.textContent = `Añadir ${type === 'hermano' ? 'Hermano Ministrante' : 'Familia'}`;
            input.value = '';
            localidadSelect.value = '';
            companeroSelect.value = '';
        }
        
        modal.style.display = 'block';
        input.focus();
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
        this.currentEditItem = null;
        this.currentEditType = null;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('itemName').value.trim();
        const localidad = document.getElementById('localidadSelect').value;
        const companeroId = document.getElementById('companeroSelect').value;
        
        if (!name) return;

        if (this.currentEditItem) {
            this.editItem(this.currentEditItem.id, name, localidad, companeroId);
        } else {
            this.addItem(this.currentEditType, name, localidad, companeroId);
        }
        
        this.closeModal();
        this.render();
        await this.saveData();
    }

    addItem(type, name, localidad, companeroId) {
        const item = {
            id: Date.now(),
            name: name,
            localidad: localidad,
            hermanoId: type === 'familia' ? null : null,
            grupoId: type === 'hermano' && companeroId ? this.getOrCreateGrupo(parseInt(companeroId)) : null
        };

        if (type === 'hermano') {
            this.hermanos.push(item);
            if (companeroId) {
                this.addToGrupo(item.id, parseInt(companeroId));
            }
        } else {
            this.familias.push(item);
        }
    }

    editItem(id, newName, localidad, companeroId) {
        const hermano = this.hermanos.find(h => h.id === id);
        const familia = this.familias.find(f => f.id === id);
        
        if (hermano) {
            hermano.name = newName;
            hermano.localidad = localidad;
            if (companeroId) {
                this.removeFromGrupo(id);
                this.addToGrupo(id, parseInt(companeroId));
            } else {
                this.removeFromGrupo(id);
            }
        }
        if (familia) {
            familia.name = newName;
            familia.localidad = localidad;
        }
    }

    async deleteItem(id, type) {
        if (confirm('¿Estás seguro de eliminar este elemento?')) {
            if (type === 'hermano') {
                this.hermanos = this.hermanos.filter(h => h.id !== id);
                this.removeFromGrupo(id);
                this.familias.forEach(f => {
                    if (f.hermanoId === id) f.hermanoId = null;
                });
            } else {
                this.familias = this.familias.filter(f => f.id !== id);
            }
            this.render();
            await this.saveData();
        }
    }

    getOrCreateGrupo(hermanoId) {
        const hermano = this.hermanos.find(h => h.id === hermanoId);
        if (hermano && hermano.grupoId) {
            return hermano.grupoId;
        }
        
        const nuevoGrupo = {
            id: Date.now(),
            hermanos: [hermanoId]
        };
        this.grupos.push(nuevoGrupo);
        
        if (hermano) hermano.grupoId = nuevoGrupo.id;
        return nuevoGrupo.id;
    }

    addToGrupo(hermanoId, targetHermanoId) {
        this.removeFromGrupo(hermanoId);
        
        const targetHermano = this.hermanos.find(h => h.id === targetHermanoId);
        let grupoId;
        
        if (targetHermano && targetHermano.grupoId) {
            grupoId = targetHermano.grupoId;
            const grupo = this.grupos.find(g => g.id === grupoId);
            if (grupo && !grupo.hermanos.includes(hermanoId)) {
                grupo.hermanos.push(hermanoId);
            }
        } else {
            grupoId = this.getOrCreateGrupo(targetHermanoId);
            const grupo = this.grupos.find(g => g.id === grupoId);
            if (grupo && !grupo.hermanos.includes(hermanoId)) {
                grupo.hermanos.push(hermanoId);
            }
        }
        
        const hermano = this.hermanos.find(h => h.id === hermanoId);
        if (hermano) hermano.grupoId = grupoId;
    }

    removeFromGrupo(hermanoId) {
        const hermano = this.hermanos.find(h => h.id === hermanoId);
        if (hermano && hermano.grupoId) {
            const grupo = this.grupos.find(g => g.id === hermano.grupoId);
            if (grupo) {
                grupo.hermanos = grupo.hermanos.filter(id => id !== hermanoId);
                if (grupo.hermanos.length <= 1) {
                    this.grupos = this.grupos.filter(g => g.id !== grupo.id);
                    if (grupo.hermanos.length === 1) {
                        const ultimoHermano = this.hermanos.find(h => h.id === grupo.hermanos[0]);
                        if (ultimoHermano) ultimoHermano.grupoId = null;
                    }
                }
            }
            hermano.grupoId = null;
        }
    }

    updateCompaneroOptions() {
        const companeroSelect = document.getElementById('companeroSelect');
        companeroSelect.innerHTML = '<option value="">Sin compañero</option>';
        
        const hermanosDisponibles = this.hermanos.filter(h => 
            (!this.currentEditItem || h.id !== this.currentEditItem.id)
        );
        
        hermanosDisponibles.forEach(hermano => {
            const option = document.createElement('option');
            option.value = hermano.id;
            option.textContent = hermano.name;
            companeroSelect.appendChild(option);
        });
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase();
        this.render();
    }

    handleLocalidadFilter(localidad) {
        this.localidadFilter = localidad;
        this.render();
    }

    filterItems(items) {
        return items.filter(item => {
            const matchesSearch = !this.searchTerm || 
                item.name.toLowerCase().includes(this.searchTerm);
            const matchesLocalidad = !this.localidadFilter || 
                item.localidad === this.localidadFilter;
            return matchesSearch && matchesLocalidad;
        });
    }

    render() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '';

        // Filtrar elementos
        const hermanosFiltrados = this.filterItems(this.hermanos);
        const familiasFiltradas = this.filterItems(this.familias);

        // Columna de familias sin asignar
        const familiasColumn = this.createColumn('Familias Sin Asignar', 'familias-sin-asignar');
        const familiasSinAsignar = familiasFiltradas.filter(f => !f.hermanoId);
        familiasSinAsignar.forEach(familia => {
            familiasColumn.appendChild(this.createItem(familia, 'familia'));
        });
        mainContent.appendChild(familiasColumn);

        // Agrupar hermanos por grupos
        const hermanosProcessed = new Set();
        const gruposProcessed = new Set();
        
        hermanosFiltrados.forEach(hermano => {
            if (hermanosProcessed.has(hermano.id)) return;
            
            let columnTitle = hermano.name;
            let columnId = `hermano-${hermano.id}`;
            let hermanosDelGrupo = [hermano];
            
            // Si tiene grupo, crear columna conjunta
            if (hermano.grupoId && !gruposProcessed.has(hermano.grupoId)) {
                const grupo = this.grupos.find(g => g.id === hermano.grupoId);
                if (grupo) {
                    hermanosDelGrupo = grupo.hermanos
                        .map(id => this.hermanos.find(h => h.id === id))
                        .filter(h => h && hermanosFiltrados.includes(h));
                    
                    if (hermanosDelGrupo.length > 1) {
                        columnTitle = hermanosDelGrupo.map(h => h.name).join(' & ');
                        columnId = `grupo-${hermano.grupoId}`;
                        gruposProcessed.add(hermano.grupoId);
                        hermanosDelGrupo.forEach(h => hermanosProcessed.add(h.id));
                    }
                }
            }
            
            if (!hermanosProcessed.has(hermano.id)) {
                hermanosProcessed.add(hermano.id);
            }
            
            const hermanoColumn = this.createColumn(columnTitle, columnId);
            
            // Crear sección de compañeros
            const companeroSection = document.createElement('div');
            companeroSection.className = 'companero-section';
            
            hermanosDelGrupo.forEach(h => {
                const hermanoItem = this.createItem(h, 'hermano');
                hermanoItem.style.backgroundColor = '#e3f2fd';
                hermanoItem.style.borderLeftColor = '#2196f3';
                companeroSection.appendChild(hermanoItem);
            });
            
            hermanoColumn.appendChild(companeroSection);
            
            // Separador visual
            const separator = document.createElement('div');
            separator.className = 'families-separator';
            separator.textContent = '--- Familias ---';
            hermanoColumn.appendChild(separator);
            
            // Añadir familias asignadas a cualquier hermano del grupo
            const idsDelGrupo = hermanosDelGrupo.map(h => h.id);
            const familiasAsignadas = familiasFiltradas.filter(f => 
                idsDelGrupo.includes(f.hermanoId)
            );
            
            const familiasContainer = document.createElement('div');
            familiasContainer.className = 'familias-container';
            
            familiasAsignadas.forEach(familia => {
                familiasContainer.appendChild(this.createItem(familia, 'familia'));
            });
            
            hermanoColumn.appendChild(familiasContainer);
            
            mainContent.appendChild(hermanoColumn);
        });
    }

    createColumn(title, id) {
        const column = document.createElement('div');
        column.className = 'column drop-zone';
        column.dataset.columnId = id;
        
        const header = document.createElement('h3');
        header.textContent = title;
        column.appendChild(header);
        
        this.setupDropZone(column);
        
        return column;
    }

    createItem(item, type) {
        const itemDiv = document.createElement('div');
        itemDiv.className = `item ${type === 'familia' ? 'familia-item' : ''}`;
        itemDiv.draggable = true;
        itemDiv.dataset.itemId = item.id;
        itemDiv.dataset.itemType = type;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'item-content';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = item.name;
        
        const localidadSpan = document.createElement('span');
        localidadSpan.className = 'item-localidad';
        localidadSpan.textContent = item.localidad || '';
        
        contentDiv.appendChild(nameSpan);
        if (item.localidad) {
            contentDiv.appendChild(localidadSpan);
        }
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.textContent = '✏️';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            this.openModal(type, item);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            await this.deleteItem(item.id, type);
        };
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        itemDiv.appendChild(contentDiv);
        itemDiv.appendChild(actionsDiv);
        
        this.setupDragAndDrop(itemDiv);
        
        return itemDiv;
    }

    setupDragAndDrop(item) {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', '');
            item.classList.add('dragging');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    }

    setupDropZone(column) {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.style.backgroundColor = 'rgba(0,123,255,0.2)';
        });
        
        column.addEventListener('dragleave', () => {
            column.style.backgroundColor = '';
        });
        
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.style.backgroundColor = '';
            
            const draggedItem = document.querySelector('.dragging');
            if (!draggedItem) return;
            
            const itemId = parseInt(draggedItem.dataset.itemId);
            const itemType = draggedItem.dataset.itemType;
            const columnId = column.dataset.columnId;
            
            if (itemType === 'familia') {
                const familia = this.familias.find(f => f.id === itemId);
                if (familia) {
                    if (columnId === 'familias-sin-asignar') {
                        familia.hermanoId = null;
                    } else if (columnId.startsWith('hermano-')) {
                        const hermanoId = parseInt(columnId.replace('hermano-', ''));
                        familia.hermanoId = hermanoId;
                    } else if (columnId.startsWith('grupo-')) {
                        const grupoId = parseInt(columnId.replace('grupo-', ''));
                        const grupo = this.grupos.find(g => g.id === grupoId);
                        if (grupo && grupo.hermanos.length > 0) {
                            familia.hermanoId = grupo.hermanos[0];
                        }
                    }
                    this.render();
                    await this.saveData();
                }
            } else if (itemType === 'hermano') {
                const hermano = this.hermanos.find(h => h.id === itemId);
                if (hermano) {
                    if (columnId.startsWith('hermano-')) {
                        const targetHermanoId = parseInt(columnId.replace('hermano-', ''));
                        if (hermano.id !== targetHermanoId) {
                            this.addToGrupo(hermano.id, targetHermanoId);
                        }
                    } else if (columnId.startsWith('grupo-')) {
                        const grupoId = parseInt(columnId.replace('grupo-', ''));
                        const grupo = this.grupos.find(g => g.id === grupoId);
                        if (grupo && grupo.hermanos.length > 0 && !grupo.hermanos.includes(hermano.id)) {
                            this.removeFromGrupo(hermano.id);
                            grupo.hermanos.push(hermano.id);
                            hermano.grupoId = grupoId;
                        }
                    }
                    this.render();
                    await this.saveData();
                }
            }
        });
    }

    getGrupoHermanos(hermanoId) {
        const hermano = this.hermanos.find(h => h.id === hermanoId);
        if (hermano && hermano.grupoId) {
            const grupo = this.grupos.find(g => g.id === hermano.grupoId);
            return grupo ? grupo.hermanos.filter(id => id !== hermanoId) : [];
        }
        return [];
    }

    async loadData() {
        try {
            const response = await fetch(this.apiUrl);
            if (response.ok) {
                const data = await response.json();
                this.hermanos = data.hermanos || [];
                this.familias = data.familias || [];
                this.grupos = data.grupos || [];
                
                // Convertir campos de base de datos
                this.hermanos = this.hermanos.map(h => ({
                    id: parseInt(h.id),
                    name: h.name,
                    localidad: h.localidad,
                    grupoId: h.grupo_id ? parseInt(h.grupo_id) : null
                }));
                
                this.familias = this.familias.map(f => ({
                    id: parseInt(f.id),
                    name: f.name,
                    localidad: f.localidad,
                    hermanoId: f.hermano_id ? parseInt(f.hermano_id) : null
                }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        this.render();
    }

    async saveData() {
        try {
            await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hermanos: this.hermanos,
                    familias: this.familias,
                    grupos: this.grupos
                })
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
}

// Función global para cerrar modal (llamada desde HTML)
function closeModal() {
    app.closeModal();
}

// Inicializar la aplicación
const app = new MinisterioApp();