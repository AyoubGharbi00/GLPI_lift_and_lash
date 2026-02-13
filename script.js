        // ============================================
        // DEBUG FUNCTIONS
        // ============================================
        let debugMode = false;
        function toggleDebug() {
            debugMode = !debugMode;
            document.getElementById('debugConsole').classList.toggle('hidden');
        }
        
        function debug(msg, type = 'info') {
            const output = document.getElementById('debugOutput');
            const color = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#10b981';
            output.innerHTML += `<div style="color: ${color}">[${new Date().toLocaleTimeString()}] ${msg}</div>`;
            output.scrollTop = output.scrollHeight;
            console.log(`[${type}] ${msg}`);
        }

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

        // Initialize Firebase
        let db = null;
        let isOnline = false;
        let firebaseInitialized = false;
        
        function initFirebase() {
            try {
                if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
                    firebase.initializeApp(firebaseConfig);
                    db = firebase.firestore();
                    isOnline = true;
                    firebaseInitialized = true;
                    debug("✅ Firebase connected successfully", "success");
                    updateConnectionStatus(true);
                    return true;
                } else {
                    debug("⚠️ Invalid Firebase config", "error");
                    updateConnectionStatus(false);
                    return false;
                }
            } catch (error) {
                debug("❌ Firebase init error: " + error.message, "error");
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
        
        // Demo data - ALWAYS AVAILABLE (fallback)
        const demoUsers = [
            { id: 1, firstName: 'Admin', lastName: 'System', email: 'admin@glpi-lite.com', password: 'admin', role: 'admin', department: 'IT' },
            { id: 2, firstName: 'Tech', lastName: 'Support', email: 'tech@glpi-lite.com', password: 'tech', role: 'tech', department: 'IT' },
            { id: 3, firstName: 'Jean', lastName: 'Dupont', email: 'user@glpi-lite.com', password: 'user', role: 'user', department: 'Production' }
        ];

        // Working data (starts with demo data)
        let localUsers = [...demoUsers];
        let localTickets = [
            { id: 1, title: 'Imprimante ne répond plus', description: 'L\'imprimante du bureau 302 ne répond plus depuis ce matin.', requester: 'marie.martin@company.com', service: 'RH', priority: 'Normal', status: 'En cours', createdAt: '2024-01-15', resolvedAt: null, assignedTo: 'tech@glpi-lite.com' },
            { id: 2, title: 'PC lent au démarrage', description: 'Le PC de production prend 10 minutes à démarrer.', requester: 'jean.dupont@company.com', service: 'Production', priority: 'Normal', status: 'Nouveau', createdAt: '2024-01-16', resolvedAt: null, assignedTo: null }
        ];
        let localAssets = [
            { id: 1, name: 'PC-DELL-001', type: 'PC', serial: 'SN123456789', location: 'Bureau 302', status: 'En service', purchaseDate: '2023-01-15' },
            { id: 2, name: 'PRT-HP-001', type: 'Imprimante', serial: 'SN987654321', location: 'Bureau 302', status: 'En panne', purchaseDate: '2022-06-20' }
        ];
        let localMaintenance = [];

        // Data getters with fallback
        async function getUsers() {
            debug("Getting users...");
            if (isOnline && db) {
                try {
                    const snapshot = await db.collection('users').get();
                    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    debug(`✅ Loaded ${users.length} users from Firebase`, "success");
                    // If Firebase has users, use them. Otherwise use local.
                    if (users.length > 0) {
                        localUsers = users;
                        return users;
                    }
                } catch (error) {
                    debug("❌ Error loading from Firebase: " + error.message, "error");
                }
            }
            debug(`Using ${localUsers.length} local users`);
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
                    debug("Error loading tickets: " + error.message, "error");
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
                    debug("Error loading assets: " + error.message, "error");
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
            
            debug(`Login attempt: ${email}`);
            
            // Ensure users are loaded
            const users = await getUsers();
            
            debug(`Checking against ${users.length} users: ${users.map(u => u.email).join(', ')}`);
            
            // Find matching user
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                debug(`✅ Login successful: ${user.firstName} ${user.lastName} (${user.role})`, "success");
                currentUser = user;
                saveSession(user);
                
                // Hide login, show app
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                
                // Initialize app
                await initApp();
            } else {
                debug(`❌ Login failed for ${email}`, "error");
                
                // Check if email exists with wrong password
                const emailExists = users.find(u => u.email === email);
                if (emailExists) {
                    alert('Mot de passe incorrect pour cet email');
                } else {
                    alert(`Email "${email}" non trouvé. Utilisateurs disponibles:\n${users.map(u => u.email).join('\n')}`);
                }
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
                debug('Session load error: ' + e.message, "error");
            }
            return null;
        }

        async function checkExistingSession() {
            const sessionUser = loadSession();
            if (sessionUser) {
                debug('Restoring session for: ' + sessionUser.email);
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
            debug('Logged out');
        }

        // ============================================
        // APP INITIALIZATION
        // ============================================
        
        async function initApp() {
            debug('Initializing app...');
            
            // Update UI with user info
            document.getElementById('sidebarUserName').textContent = currentUser.firstName + ' ' + currentUser.lastName;
            document.getElementById('sidebarUserEmail').textContent = currentUser.email;
            document.getElementById('userRoleDisplay').textContent = getRoleLabel(currentUser.role);
            
            // Show/hide admin elements
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                if (currentUser.role === 'admin') {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });

            // Load all data
            await loadAllData();
            
            // Render all sections
            updateDashboard();
            renderTickets();
            renderAssets();
            renderMaintenance();
            renderUsers();
            updateStats();
            
            debug('App initialized successfully', "success");
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
            });
            
            const navItem = document.getElementById('nav-' + sectionId);
            if (navItem) navItem.classList.add('active');
            
            if (sectionId === 'dashboard') updateDashboard();
            if (sectionId === 'stats') updateStats();
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        }

        // ============================================
        // DASHBOARD
        // ============================================
        
        function updateDashboard() {
            document.getElementById('dashTotalTickets').textContent = localTickets.length;
            document.getElementById('dashOpenTickets').textContent = localTickets.filter(t => t.status !== 'Résolu').length;
            document.getElementById('dashResolvedTickets').textContent = localTickets.filter(t => t.status === 'Résolu').length;
            document.getElementById('dashTotalAssets').textContent = localAssets.length;
            
            const openCount = localTickets.filter(t => t.status !== 'Résolu').length;
            const badge = document.getElementById('ticketBadge');
            if (openCount > 0) {
                badge.textContent = openCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
            
            // Recent tickets
            const recentTickets = localTickets.slice(-5).reverse();
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
            
            // Broken assets
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
            
            let filteredTickets = localTickets.filter(ticket => {
                if (statusFilter && ticket.status !== statusFilter) return false;
                if (priorityFilter && ticket.priority !== priorityFilter) return false;
                if (searchTerm && !ticket.title.toLowerCase().includes(searchTerm) && !ticket.id.toString().includes(searchTerm)) return false;
                return true;
            });

            if (currentUser.role === 'user') {
                filteredTickets = filteredTickets.filter(t => t.requester === currentUser.email);
            }

            tbody.innerHTML = filteredTickets.map(ticket => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#${ticket.id}</td>
                    <td class="px-6 py-4 text-sm text-gray-900 font-medium">${ticket.title}</td>
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
                        <button onclick="showTicketDetail(${ticket.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${currentUser.role !== 'user' ? `
                            <button onclick="takeTicket(${ticket.id})" class="text-green-600 hover:text-green-900 mr-3" title="Prendre en charge">
                                <i class="fas fa-hand-paper"></i>
                            </button>
                            ${ticket.status !== 'Résolu' ? `
                                <button onclick="resolveTicket(${ticket.id})" class="text-purple-600 hover:text-purple-900" title="Résoudre">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                        ` : ''}
                    </td>
                </tr>
            `).join('');
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
        }

        function closeTicketModal() {
            document.getElementById('ticketModal').classList.add('hidden');
            document.getElementById('ticketForm').reset();
        }

        document.getElementById('ticketForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
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
                assignedTo: null
            };
            
            localTickets.push(newTicket);
            
            if (isOnline && db) {
                try {
                    await db.collection('tickets').add(newTicket);
                    debug('Ticket saved to Firebase', 'success');
                } catch (error) {
                    debug('Error saving to Firebase: ' + error.message, 'error');
                }
            }
            
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
                    
                    ${currentUser.role !== 'user' && ticket.status !== 'Résolu' ? `
                        <div class="flex space-x-3 pt-4 border-t">
                            ${!ticket.assignedTo ? `
                                <button onclick="takeTicket(${ticket.id}); closeTicketDetailModal()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                    Prendre en charge
                                </button>
                            ` : ''}
                            <button onclick="resolveTicket(${ticket.id}); closeTicketDetailModal()" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                                Marquer comme résolu
                            </button>
                        </div>
                    ` : ''}
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
                        await db.collection('tickets').doc(id.toString()).update({ assignedTo: currentUser.email, status: 'En cours' });
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
                        await db.collection('tickets').doc(id.toString()).update({ status: 'Résolu', resolvedAt: ticket.resolvedAt });
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
                        await db.collection('assets').doc(id.toString()).update({ status: asset.status });
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
                                    <span>${m.technician}</span>
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
                        await db.collection('users').doc(id.toString()).delete();
                    } catch (e) {}
                }
                
                renderUsers();
            }
        }

        // ============================================
        // STATS
        // ============================================

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
            debug('Application starting...');
            
            // Initialize Firebase
            initFirebase();
            
            // Check for existing session
            const hasSession = await checkExistingSession();
            
            if (!hasSession) {
                debug('No existing session, showing login screen');
            }
        };
