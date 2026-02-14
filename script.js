// ============================================

        // ============================================
        // FIREBASE CONFIGURATION
        // ============================================
        const firebaseConfig = {
            apiKey: "AIzaSyCXK2_BvyMKt0z2FrXHSkb1pFc3zxmItVE",
            authDomain: "gpli-lift-and-lash.firebaseapp.com",
            projectId: "gpli-lift-and-lash",
            storageBucket: "gpli-lift-and-lash.firebasestorage.app",
            messagingSenderId: "991885081401",
            appId: "1:991885081401:web:ae9e8834c6bd58c51ec6e8",
            measurementId: "G-H9FLJK4EH6"
        };

        let db = null;
        let storage = null;
        let isOnline = false;
        let firebaseInitialized = false;
        
        function initFirebase() {
            try {
                if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
                    firebase.initializeApp(firebaseConfig);
                    db = firebase.firestore();
                    storage = firebase.storage();
                    isOnline = true;
                    firebaseInitialized = true;
                    updateConnectionStatus(true);
                    return true;
                } else {
                    updateConnectionStatus(false);
                    return false;
                }
            } catch (error) {
                updateConnectionStatus(false);
                return false;
            }
        }

        function updateConnectionStatus(connected) {
            const statusBadge = document.getElementById('connectionStatus');
            const statusText = document.getElementById('statusText');
            const firebaseStatus = document.getElementById('firebaseStatus');
            const onlineIndicator = document.getElementById('onlineIndicator');
            const onlineText = document.getElementById('onlineText');
            
            if (connected) {
                statusBadge.className = "mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs";
                statusText.textContent = "Online";
                firebaseStatus.textContent = "Firebase connecté - Données synchronisées";
                if (onlineIndicator) onlineIndicator.className = "w-2 h-2 bg-green-500 rounded-full mr-1";
                if (onlineText) onlineText.textContent = "Online";
            } else {
                statusBadge.className = "mt-2 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs";
                statusText.textContent = "Mode Local";
                firebaseStatus.textContent = "Mode local - Les données ne sont pas synchronisées";
                if (onlineIndicator) onlineIndicator.className = "w-2 h-2 bg-yellow-500 rounded-full mr-1";
                if (onlineText) onlineText.textContent = "Local";
            }
        }

        // ============================================
        // DATA MANAGEMENT
        // ============================================
        
        let currentUser = null;
        const SESSION_KEY = 'glpi_lite_session';
        
        const demoUsers = [
            { id: 1, firstName: 'Admin', lastName: 'System', email: 'admin@glpi-lite.com', password: 'admin', role: 'admin', department: 'IT' },
            { id: 2, firstName: 'Tech', lastName: 'Support', email: 'tech@glpi-lite.com', password: 'tech', role: 'tech', department: 'IT' },
            { id: 3, firstName: 'Jean', lastName: 'Dupont', email: 'user@glpi-lite.com', password: 'user', role: 'user', department: 'Production' },
            { id: 4, firstName: 'Marie', lastName: 'Martin', email: 'marie@informatique.com', password: 'marie', role: 'tech', department: 'Informatique' }
        ];

        let localUsers = [...demoUsers];
        let localTickets = [
            { id: 1, title: 'Imprimante ne répond plus', description: 'L\'imprimante du bureau 302 ne répond plus depuis ce matin.', requester: 'marie.martin@company.com', service: 'RH', priority: 'Normal', status: 'En cours', createdAt: '2024-01-15', resolvedAt: null, assignedTo: 'tech@glpi-lite.com', panneType: null, attachmentUrl: null, attachmentName: null },
            { id: 2, title: 'PC lent au démarrage', description: 'Le PC de production prend 10 minutes à démarrer.', requester: 'jean.dupont@company.com', service: 'Production', priority: 'Normal', status: 'Nouveau', createdAt: '2024-01-16', resolvedAt: null, assignedTo: null, panneType: null, attachmentUrl: null, attachmentName: null },
            { id: 3, title: 'Problème réseau', description: 'Pas de connexion internet', requester: 'user@glpi-lite.com', service: 'Informatique', priority: 'Urgent', status: 'En cours', createdAt: '2024-01-17', resolvedAt: null, assignedTo: 'marie@informatique.com', panneType: 'Reseau', attachmentUrl: null, attachmentName: null }
        ];
        let localAssets = [
            { id: 1, name: 'PC-DELL-001', type: 'PC', serial: 'SN123456789', location: 'Bureau 302', status: 'En service', purchaseDate: '2023-01-15' },
            { id: 2, name: 'PRT-HP-001', type: 'Imprimante', serial: 'SN987654321', location: 'Bureau 302', status: 'En panne', purchaseDate: '2022-06-20' }
        ];
        let localMaintenance = [];
        async function getUsers() {
            if (isOnline && db) {
                try {
                    const snapshot = await db.collection('users').get();
                    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    if (users.length > 0) {
                        localUsers = users;
                        return users;
                    }
                } catch (error) {
                }
            }
            return localUsers;
        }

        async function getTickets() {
            if (isOnline && db) {
                try {
                    const snapshot = await db.collection('tickets').get();
                    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    if (tickets.length > 0) {
                        localTickets = tickets;
                        return tickets;
                    }
                } catch (error) {
                }
            }
            return localTickets;
        }

        async function getAssets() {
            if (isOnline && db) {
                try {
                    const snapshot = await db.collection('assets').get();
                    const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    if (assets.length > 0) {
                        localAssets = assets;
                        return assets;
                    }
                } catch (error) {
                }
            }
            return localAssets;
        }

        // ============================================
        // AUTH FUNCTIONS
        // ============================================
        
        async function handleLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            
            const users = await getUsers();
            
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = user;
                saveSession(user);
                
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                
                await initApp();
            } else {
                alert('Email ou mot de passe incorrect');
            }
        }

        document.getElementById('loginForm').addEventListener('submit', handleLogin);

        function saveSession(user) {
            if (user) {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
            } else {
                sessionStorage.removeItem(SESSION_KEY);
            }
        }

        function loadSession() {
            try {
                const session = sessionStorage.getItem(SESSION_KEY);
                if (session) {
                    return JSON.parse(session);
                }
            } catch (e) {
            }
            return null;
        }

        async function checkExistingSession() {
            const sessionUser = loadSession();
            if (sessionUser) {
                currentUser = sessionUser;
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                await initApp();
                return true;
            }
            return false;
        }

        function logout() {
            currentUser = null;
            saveSession(null);
            document.getElementById('app').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('loginForm').reset();
        }

        // ============================================
        // APP INITIALIZATION
        // ============================================
        
        async function initApp() {
            
            // Appliquer le thème selon le rôle
            applyRoleTheme();
            
            document.getElementById('sidebarUserName').textContent = currentUser.firstName + ' ' + currentUser.lastName;
            document.getElementById('sidebarUserEmail').textContent = currentUser.email;
            document.getElementById('userRoleDisplay').textContent = getRoleLabel(currentUser.role);
            
            updateUIBasedOnRole();
            
            await loadAllData();
            
            updateDashboard();
            renderTickets();
            renderAssets();
            renderMaintenance();
            renderUsers();
            
        }

        function applyRoleTheme() {
            const body = document.body;
            const sidebar = document.querySelector('aside');
            const navItems = document.querySelectorAll('.sidebar-item');
            
            // Reset classes
            body.classList.remove('admin-theme', 'tech-theme', 'user-theme');
            
            if (currentUser.role === 'admin') {
                body.classList.add('admin-theme');
                // Admin: sidebar violet foncé
                if (sidebar) {
                    sidebar.style.background = 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)';
                }
                navItems.forEach(item => {
                    item.style.color = '#e0e7ff';
                });
            } else if (currentUser.role === 'tech') {
                body.classList.add('tech-theme');
                // Tech: sidebar bleu foncé
                if (sidebar) {
                    sidebar.style.background = 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)';
                }
                navItems.forEach(item => {
                    item.style.color = '#dbeafe';
                });
            } else {
                body.classList.add('user-theme');
                // User: sidebar normale (blanche)
                if (sidebar) {
                    sidebar.style.background = '#ffffff';
                }
            }
        }

        function updateUIBasedOnRole() {
            const usersNav = document.getElementById('nav-users');
            if (usersNav && currentUser.role !== 'admin') {
                usersNav.classList.add('hidden');
            }
            
            const maintenanceNav = document.getElementById('nav-maintenance');
            if (maintenanceNav && currentUser.role === 'user') {
                maintenanceNav.classList.add('hidden');
            }
            
            const assetsNav = document.getElementById('nav-assets');
            if (assetsNav && currentUser.role === 'user') {
                assetsNav.classList.add('hidden');
            }
        }

        async function loadAllData() {
            await getUsers();
            await getTickets();
            await getAssets();
        }

        function getRoleLabel(role) {
            const roles = { admin: 'Administrateur', tech: 'Technicien IT', user: 'Employé' };
            return roles[role] || role;
        }

        // ============================================
        // NAVIGATION
        // ============================================
        
        function showSection(sectionId) {
            document.querySelectorAll('.section-content').forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(sectionId).classList.remove('hidden');
            
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
                // Réappliquer la couleur selon le thème
                if (currentUser.role === 'admin') {
                    item.style.color = '#e0e7ff';
                } else if (currentUser.role === 'tech') {
                    item.style.color = '#dbeafe';
                }
            });
            
            const navItem = document.getElementById('nav-' + sectionId);
            if (navItem) {
                navItem.classList.add('active');
                if (currentUser.role === 'admin') {
                    navItem.style.background = 'rgba(167, 139, 250, 0.2)';
                    navItem.style.borderRight = '3px solid #a78bfa';
                    navItem.style.color = '#a78bfa';
                } else if (currentUser.role === 'tech') {
                    navItem.style.background = 'rgba(96, 165, 250, 0.2)';
                    navItem.style.borderRight = '3px solid #60a5fa';
                    navItem.style.color = '#60a5fa';
                }
            }
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        }

        // ============================================
        // DASHBOARD
        // ============================================
        
        function getVisibleTickets() {
            let visibleTickets = localTickets;
            
            if (currentUser.role === 'admin') {
                // Admin voit tout
                visibleTickets = localTickets;
            } else if (currentUser.department === 'Informatique' || currentUser.department === 'IT') {
                // Tech Informatique: voir les tickets IT + ceux qui lui sont assignés + ceux qu'il a créés
                visibleTickets = localTickets.filter(t => 
                    t.service === 'Informatique' || 
                    t.assignedTo === currentUser.email ||
                    t.requester === currentUser.email
                );
            } else if (currentUser.role === 'tech') {
                // Autres techs: voir ceux de leur département + assignés + créés
                visibleTickets = localTickets.filter(t => 
                    t.service === currentUser.department || 
                    t.assignedTo === currentUser.email ||
                    t.requester === currentUser.email
                );
            } else {
                // Employé: voir seulement ses tickets (tous les statuts)
                visibleTickets = localTickets.filter(t => t.requester === currentUser.email);
            }
            
            return visibleTickets;
        }

        function updateDashboard() {
            const visibleTickets = getVisibleTickets();
            
            document.getElementById('dashTotalTickets').textContent = visibleTickets.length;
            document.getElementById('dashOpenTickets').textContent = visibleTickets.filter(t => t.status !== 'Résolu').length;
            document.getElementById('dashResolvedTickets').textContent = visibleTickets.filter(t => t.status === 'Résolu').length;
            document.getElementById('dashTotalAssets').textContent = localAssets.length;
            
            const openCount = visibleTickets.filter(t => t.status !== 'Résolu').length;
            const badge = document.getElementById('ticketBadge');
            if (openCount > 0) {
                badge.textContent = openCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
            
            const recentTickets = visibleTickets.slice(-5).reverse();
            const recentHtml = recentTickets.map(ticket => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onclick="showTicketDetail(${ticket.id})">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">${ticket.title}</p>
                        <p class="text-xs text-gray-500">${ticket.service} • ${ticket.createdAt}</p>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}">${ticket.status}</span>
                </div>
            `).join('');
            document.getElementById('recentTicketsList').innerHTML = recentHtml || '<p class="text-gray-400 text-sm">Aucun ticket</p>';
            
            const brokenAssets = localAssets.filter(a => a.status === 'En panne');
            const brokenHtml = brokenAssets.map(asset => `
                <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                        <div>
                            <p class="text-sm font-medium text-gray-900">${asset.name}</p>
                            <p class="text-xs text-gray-500">${asset.type} • ${asset.location}</p>
                        </div>
                    </div>
                </div>
            `).join('');
            document.getElementById('brokenAssetsList').innerHTML = brokenHtml || '<p class="text-gray-400 text-sm">Aucun équipement en panne</p>';
        }

        // ============================================
        // TICKETS
        // ============================================
        
        function renderTickets() {
            const tbody = document.getElementById('ticketsTableBody');
            const statusFilter = document.getElementById('ticketStatusFilter').value;
            const priorityFilter = document.getElementById('ticketPriorityFilter').value;
            const searchTerm = document.getElementById('ticketSearch').value.toLowerCase();
            
            let filteredTickets = getVisibleTickets();
            
            // Appliquer les filtres UI
            filteredTickets = filteredTickets.filter(ticket => {
                if (statusFilter && ticket.status !== statusFilter) return false;
                if (priorityFilter && ticket.priority !== priorityFilter) return false;
                if (searchTerm && !ticket.title.toLowerCase().includes(searchTerm) && !ticket.id.toString().includes(searchTerm)) return false;
                return true;
            });

            tbody.innerHTML = filteredTickets.map(ticket => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#${ticket.id}</td>
                    <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                        ${ticket.title}
                        ${ticket.attachmentName ? '<i class="fas fa-paperclip text-blue-500 ml-2" title="Pièce jointe"></i>' : ''}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">${ticket.requester}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${ticket.service}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}">${ticket.priority}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}">${ticket.status}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ticket.createdAt}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="showTicketDetail(${ticket.id})" class="text-blue-600 hover:text-blue-900 mr-3" title="Voir détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${currentUser.role !== 'user' && ticket.status !== 'Résolu' && !ticket.assignedTo ? `
                            <button onclick="takeTicket(${ticket.id})" class="text-green-600 hover:text-green-900 mr-3" title="Prendre en charge">
                                <i class="fas fa-hand-paper"></i>
                            </button>
                        ` : ''}
                        ${currentUser.role !== 'user' && ticket.status !== 'Résolu' ? `
                            <button onclick="resolveTicket(${ticket.id})" class="text-purple-600 hover:text-purple-900 mr-3" title="Résoudre">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${canDeleteTicket(ticket) ? `
                            <button onclick="deleteTicket(${ticket.id})" class="text-red-600 hover:text-red-900" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        }

        function canDeleteTicket(ticket) {
            // Admin peut tout supprimer
            if (currentUser.role === 'admin') return true;
            // L'utilisateur peut supprimer ses propres tickets si encore "Nouveau"
            if (ticket.requester === currentUser.email && ticket.status === 'Nouveau') return true;
            // Le tech assigné peut supprimer s'il est en cours
            if (ticket.assignedTo === currentUser.email && ticket.status === 'En cours') return true;
            return false;
        }

        async function deleteTicket(id) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) return;
            
            const ticket = localTickets.find(t => t.id === id);
            if (!ticket) return;
            
            // Supprimer localement
            localTickets = localTickets.filter(t => t.id !== id);
            
            // Supprimer de Firebase
            if (isOnline && db) {
                try {
                    // Trouver le document par ID
                    const snapshot = await db.collection('tickets').where('id', '==', id).get();
                    snapshot.forEach(doc => {
                        doc.ref.delete();
                    });
                } catch (error) {
                }
            }
            
            renderTickets();
            updateDashboard();
        }

        function filterTickets() {
            renderTickets();
        }

        function getStatusColor(status) {
            const colors = {
                'Nouveau': 'bg-blue-100 text-blue-800',
                'En cours': 'bg-yellow-100 text-yellow-800',
                'Résolu': 'bg-green-100 text-green-800'
            };
            return colors[status] || 'bg-gray-100 text-gray-800';
        }

        function getPriorityColor(priority) {
            return priority === 'Urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
        }

        function openTicketModal() {
            document.getElementById('ticketModal').classList.remove('hidden');
            document.getElementById('panneTypeContainer').classList.add('hidden');
            document.getElementById('panneTypeSelect').value = '';
        }

        function closeTicketModal() {
            document.getElementById('ticketModal').classList.add('hidden');
            document.getElementById('ticketForm').reset();
            document.getElementById('selectedFileName').classList.add('hidden');
            document.getElementById('attachmentUrl').value = '';
            document.getElementById('attachmentName').value = '';
        }

        function onServiceChange() {
            const service = document.getElementById('ticketServiceSelect').value;
            const panneContainer = document.getElementById('panneTypeContainer');
            
            if (service === 'Informatique') {
                panneContainer.classList.remove('hidden');
            } else {
                panneContainer.classList.add('hidden');
                document.getElementById('panneTypeSelect').value = '';
            }
        }

        function handleFileSelect(input) {
            const file = input.files[0];
            if (file) {
                const fileNameDisplay = document.getElementById('selectedFileName');
                fileNameDisplay.textContent = `Fichier sélectionné: ${file.name}`;
                fileNameDisplay.classList.remove('hidden');
                document.getElementById('attachmentName').value = file.name;
            }
        }

        async function uploadFile(file) {
            if (!storage || !isOnline) {
                return null;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Fichier trop grand (max 5MB). Le ticket sera créé sans pièce jointe.');
                return null;
            }
            
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                 
                    resolve(null);
                }, 10000);
                
                const storageRef = storage.ref(`tickets/${Date.now()}_${file.name}`);
                
                storageRef.put(file)
                    .then(snapshot => snapshot.ref.getDownloadURL())
                    .then(downloadUrl => {
                        clearTimeout(timeout);
                        resolve(downloadUrl);
                    })
                    .catch(error => {
                        clearTimeout(timeout);
                        resolve(null);
                    });
            });
        }

        document.getElementById('ticketForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Création...';
            
            const formData = new FormData(e.target);
            const fileInput = document.getElementById('ticketAttachment');
            
            let attachmentUrl = null;
            let attachmentName = formData.get('attachmentName');
            
            if (fileInput.files[0] && isOnline && storage) {
                document.getElementById('syncStatus').classList.remove('hidden');
                attachmentUrl = await uploadFile(fileInput.files[0]);
                document.getElementById('syncStatus').classList.add('hidden');
            }
            
            const newTicket = {
                id: Date.now(),
                title: formData.get('title'),
                description: formData.get('description'),
                requester: currentUser.email,
                service: formData.get('service'),
                priority: formData.get('priority'),
                status: 'Nouveau',
                createdAt: new Date().toISOString().split('T')[0],
                resolvedAt: null,
                assignedTo: null,
                panneType: formData.get('panneType') || null,
                attachmentUrl: attachmentUrl,
                attachmentName: attachmentName || null
            };
            
            localTickets.push(newTicket);
            
            if (isOnline && db) {
                try {
                    await db.collection('tickets').add(newTicket);
                } catch (error) {
                }
            }
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Créer';
            
            closeTicketModal();
            renderTickets();
            updateDashboard();
        });

        function showTicketDetail(id) {
            const ticket = localTickets.find(t => t.id === id);
            if (!ticket) return;
            
            const content = document.getElementById('ticketDetailContent');
            content.innerHTML = `
                <div class="space-y-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-lg font-bold text-gray-900">${ticket.title}</h4>
                            <p class="text-sm text-gray-500">#${ticket.id} • Créé le ${ticket.createdAt}</p>
                        </div>
                        <div class="flex space-x-2">
                            <span class="px-3 py-1 rounded-full text-sm ${getPriorityColor(ticket.priority)}">${ticket.priority}</span>
                            <span class="px-3 py-1 rounded-full text-sm ${getStatusColor(ticket.status)}">${ticket.status}</span>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h5 class="font-semibold mb-2">Description</h5>
                        <p class="text-gray-700">${ticket.description}</p>
                    </div>
                    
                    ${ticket.panneType ? `
                        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h5 class="font-semibold mb-2 text-blue-800">Type de panne</h5>
                            <p class="text-blue-700">
                                <i class="fas fa-tools mr-2"></i>
                                ${ticket.panneType === 'Materiel' ? 'Panne matérielle' : 
                                  ticket.panneType === 'Logiciel' ? 'Panne logicielle' :
                                  ticket.panneType === 'Reseau' ? 'Problème réseau' :
                                  ticket.panneType === 'Peripherique' ? 'Périphérique' : 'Autre'}
                            </p>
                        </div>
                    ` : ''}
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">Demandeur:</span>
                            <p class="font-medium">${ticket.requester}</p>
                        </div>
                        <div>
                            <span class="text-gray-500">Service:</span>
                            <p class="font-medium">${ticket.service}</p>
                        </div>
                        <div>
                            <span class="text-gray-500">Assigné à:</span>
                            <p class="font-medium">${ticket.assignedTo || 'Non assigné'}</p>
                        </div>
                    </div>
                    
                    ${ticket.attachmentUrl ? `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-semibold mb-2">Pièce jointe</h5>
                            <a href="${ticket.attachmentUrl}" target="_blank" class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                                <i class="fas fa-download mr-2"></i>
                                ${ticket.attachmentName || 'Télécharger'}
                            </a>
                        </div>
                    ` : ticket.attachmentName ? `
                        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h5 class="font-semibold mb-2 text-yellow-800">Pièce jointe</h5>
                            <p class="text-yellow-700 text-sm">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                Fichier "${ticket.attachmentName}" non disponible (upload échoué)
                            </p>
                        </div>
                    ` : ''}
                    
                    <div class="flex space-x-3 pt-4 border-t">
                        ${currentUser.role !== 'user' && ticket.status !== 'Résolu' && !ticket.assignedTo ? `
                            <button onclick="takeTicket(${ticket.id}); closeTicketDetailModal()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                Prendre en charge
                            </button>
                        ` : ''}
                        ${currentUser.role !== 'user' && ticket.status !== 'Résolu' ? `
                            <button onclick="resolveTicket(${ticket.id}); closeTicketDetailModal()" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                                Marquer comme résolu
                            </button>
                        ` : ''}
                        ${canDeleteTicket(ticket) ? `
                            <button onclick="deleteTicket(${ticket.id}); closeTicketDetailModal()" class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">
                                <i class="fas fa-trash mr-2"></i>Supprimer
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            document.getElementById('ticketDetailModal').classList.remove('hidden');
        }

        function closeTicketDetailModal() {
            document.getElementById('ticketDetailModal').classList.add('hidden');
        }

        async function takeTicket(id) {
            const ticket = localTickets.find(t => t.id === id);
            if (ticket) {
                ticket.assignedTo = currentUser.email;
                ticket.status = 'En cours';
                
                if (isOnline && db) {
                    try {
                        const snapshot = await db.collection('tickets').where('id', '==', id).get();
                        snapshot.forEach(doc => {
                            doc.ref.update({ assignedTo: currentUser.email, status: 'En cours' });
                        });
                    } catch (e) {}
                }
                
                renderTickets();
                updateDashboard();
            }
        }

        async function resolveTicket(id) {
            const ticket = localTickets.find(t => t.id === id);
            if (ticket) {
                ticket.status = 'Résolu';
                ticket.resolvedAt = new Date().toISOString().split('T')[0];
                
                if (isOnline && db) {
                    try {
                        const snapshot = await db.collection('tickets').where('id', '==', id).get();
                        snapshot.forEach(doc => {
                            doc.ref.update({ status: 'Résolu', resolvedAt: ticket.resolvedAt });
                        });
                    } catch (e) {}
                }
                
                renderTickets();
                updateDashboard();
            }
        }

        // ============================================
        // ASSETS
        // ============================================
        
        function renderAssets() {
            const grid = document.getElementById('assetsGrid');
            grid.innerHTML = localAssets.map(asset => `
                <div class="bg-white rounded-xl shadow-sm p-6 card-hover transition border-l-4 ${asset.status === 'En panne' ? 'border-red-500' : 'border-green-500'}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <i class="fas ${getAssetIcon(asset.type)} text-2xl text-gray-600"></i>
                        </div>
                        <span class="px-2 py-1 text-xs rounded-full ${asset.status === 'En service' ? 'bg-green-100 text-green-800' : asset.status === 'En panne' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                            ${asset.status}
                        </span>
                    </div>
                    <h3 class="font-bold text-lg mb-1">${asset.name}</h3>
                    <p class="text-sm text-gray-500 mb-3">${asset.type} • ${asset.serial}</p>
                    <div class="space-y-1 text-sm text-gray-600">
                        <p><i class="fas fa-map-marker-alt w-5 text-gray-400"></i> ${asset.location}</p>
                        <p><i class="fas fa-calendar w-5 text-gray-400"></i> Acheté le ${asset.purchaseDate}</p>
                    </div>
                    ${currentUser.role !== 'user' ? `
                        <div class="mt-4 pt-4 border-t flex space-x-2">
                            <button onclick="toggleAssetStatus(${asset.id})" class="text-sm text-blue-600 hover:text-blue-800">
                                ${asset.status === 'En panne' ? 'Marquer réparé' : 'Signaler panne'}
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        function getAssetIcon(type) {
            const icons = {
                'PC': 'fa-desktop',
                'Imprimante': 'fa-print',
                'Serveur': 'fa-server',
                'Scanner': 'fa-scanner'
            };
            return icons[type] || 'fa-laptop';
        }

        function openAssetModal() {
            document.getElementById('assetModal').classList.remove('hidden');
        }

        function closeAssetModal() {
            document.getElementById('assetModal').classList.add('hidden');
            document.getElementById('assetForm').reset();
        }

        document.getElementById('assetForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newAsset = {
                id: Date.now(),
                name: formData.get('name'),
                type: formData.get('type'),
                serial: formData.get('serial'),
                location: formData.get('location'),
                status: formData.get('status'),
                purchaseDate: formData.get('purchaseDate')
            };
            
            localAssets.push(newAsset);
            
            if (isOnline && db) {
                try {
                    await db.collection('assets').add(newAsset);
                } catch (e) {}
            }
            
            closeAssetModal();
            renderAssets();
            updateDashboard();
        });

        async function toggleAssetStatus(id) {
            const asset = localAssets.find(a => a.id === id);
            if (asset) {
                asset.status = asset.status === 'En panne' ? 'En service' : 'En panne';
                
                if (isOnline && db) {
                    try {
                        const snapshot = await db.collection('assets').where('id', '==', id).get();
                        snapshot.forEach(doc => {
                            doc.ref.update({ status: asset.status });
                        });
                    } catch (e) {}
                }
                
                renderAssets();
                updateDashboard();
            }
        }

        // ============================================
        // MAINTENANCE
        // ============================================
        
        function renderMaintenance() {
            const container = document.getElementById('maintenanceTimeline');
            container.innerHTML = localMaintenance.map(m => {
                const asset = localAssets.find(a => a.id === m.assetId);
                const ticket = localTickets.find(t => t.id === m.ticketId);
                return `
                    <div class="flex space-x-4">
                        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <i class="fas fa-wrench text-blue-600"></i>
                        </div>
                        <div class="flex-1 pb-6 border-l-2 border-gray-200 pl-4 relative">
                            <div class="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-semibold text-gray-900">${m.type}</h4>
                                    <span class="text-sm text-gray-500">${m.date}</span>
                                </div>
                                <p class="text-gray-700 mb-2">${m.description}</p>
                                <div class="flex items-center text-sm text-gray-500">
                                    <i class="fas fa-user-circle mr-2"></i>
                                    <span>${m.technicien}</span>
                                    ${asset ? `<span class="mx-2">•</span><span>${asset.name}</span>` : ''}
                                    ${ticket ? `<span class="mx-2">•</span><span>Ticket #${ticket.id}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ============================================
        // USERS
        // ============================================
        
        function renderUsers() {
            if (currentUser.role !== 'admin') return;
            
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = localUsers.map(user => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <span class="text-sm font-medium text-gray-600">${user.firstName[0]}${user.lastName[0]}</span>
                            </div>
                            <div class="text-sm font-medium text-gray-900">${user.firstName} ${user.lastName}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}">
                            ${getRoleLabel(user.role)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.department}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${user.id !== currentUser.id ? `
                            <button onclick="deleteUserById(${user.id})" class="text-red-600 hover:text-red-900">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        }

        function getRoleBadgeColor(role) {
            const colors = {
                admin: 'bg-purple-100 text-purple-800',
                tech: 'bg-blue-100 text-blue-800',
                user: 'bg-gray-100 text-gray-800'
            };
            return colors[role] || 'bg-gray-100 text-gray-800';
        }

        function openUserModal() {
            document.getElementById('userModal').classList.remove('hidden');
        }

        function closeUserModal() {
            document.getElementById('userModal').classList.add('hidden');
            document.getElementById('userForm').reset();
        }

        document.getElementById('userForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newUser = {
                id: Date.now(),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role'),
                department: formData.get('department')
            };
            
            localUsers.push(newUser);
            
            if (isOnline && db) {
                try {
                    await db.collection('users').add(newUser);
                } catch (e) {}
            }
            
            closeUserModal();
            renderUsers();
        });

        async function deleteUserById(id) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                localUsers = localUsers.filter(u => u.id !== id);
                
                if (isOnline && db) {
                    try {
                        const snapshot = await db.collection('users').where('id', '==', id).get();
                        snapshot.forEach(doc => {
                            doc.ref.delete();
                        });
                    } catch (e) {}
                }
                
                renderUsers();
            }
        }

        // ============================================
        // STATS
        // ============================================
        
        function updateStats() {
            // Placeholder
        }

        // Close modals on outside click
        window.onclick = function(event) {
            if (event.target.classList.contains('fixed')) {
                event.target.classList.add('hidden');
            }
        }

        // ============================================
        // INITIALIZATION
        // ============================================
        
        window.onload = async function() {
            
            initFirebase();
            
            const hasSession = await checkExistingSession();
            
            if (!hasSession) {
            }
        };