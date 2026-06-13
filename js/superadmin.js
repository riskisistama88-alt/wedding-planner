function renderSuperadminPanel() {
    // 1. Calculate stats
    const totalProjects = appState.projects.length;
    const totalUsers = appState.projects.reduce((sum, p) => sum + (p.roles ? p.roles.length : 0), 0);
    const liveApis = appState.projects.filter(p => !!p.gasApiUrl).length;

    const saProjectsEl = document.getElementById("sa-stat-projects");
    const saUsersEl = document.getElementById("sa-stat-users");
    const saApisEl = document.getElementById("sa-stat-apis");

    if (saProjectsEl) saProjectsEl.innerText = totalProjects;
    if (saUsersEl) saUsersEl.innerText = totalUsers;
    if (saApisEl) saApisEl.innerText = liveApis;

    // Set active project if not set or not valid
    if (!saActiveProjectId && totalProjects > 0) {
        saActiveProjectId = appState.projects[0].id;
    }

    // 2. Populate table
    const tableBody = document.getElementById("sa-projects-table-body");
    if (tableBody) {
        tableBody.innerHTML = "";

        const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

        appState.projects.forEach(project => {
            const isActiveRoleProject = project.id === saActiveProjectId;
            const row = document.createElement("tr");
            row.className = `transition-colors hover:bg-[#fafafc] cursor-pointer ${isActiveRoleProject ? "bg-blue-50/40" : ""}`;
            row.onclick = (e) => {
                // Only update active project if we didn't click manage buttons
                if (e.target.closest("button") || e.target.closest("a")) return;
                saActiveProjectId = project.id;
                renderSuperadminPanel();
            };

            const backendHtml = project.gasApiUrl 
                ? `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">GAS Connected</span>`
                : `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">Simulasi</span>`;

            row.innerHTML = `
                <td class="px-5 py-4">
                    <span class="font-bold text-sm text-[#1d1d1f] block">${project.title}</span>
                    <span class="text-[10px] text-[#7a7a7a] font-mono">${project.id}</span>
                </td>
                <td class="px-5 py-4 font-semibold text-xs text-[#0066cc]">${formatIDR(project.budgetLimit)}</td>
                <td class="px-5 py-4 text-xs text-[#7a7a7a]">${formatDateForDisplay(project.targetDate)}</td>
                <td class="px-5 py-4">${backendHtml}</td>
                <td class="px-5 py-4 text-right">
                    <div class="flex items-center justify-end space-x-2">
                        <button onclick="superadminSwitchProject('${project.id}')" class="active-scale w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-blue-50 hover:text-[#0066cc] transition flex items-center justify-center text-gray-500" title="Masuk &amp; Audit Workspace">
                            <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                        </button>
                        <button onclick="editsaProject('${project.id}')" class="active-scale w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-gray-200 transition flex items-center justify-center text-gray-500" title="Edit Proyek">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="deletesaProject('${project.id}')" class="active-scale w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center text-gray-500" title="Hapus Proyek">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 3. Render roles on the right panel
    renderSaRoles();
}

function renderSuperadminGlobalSwitcher() {
    const selector = document.getElementById("superadmin-project-selector");
    if (!selector) return;

    selector.innerHTML = "";
    appState.projects.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.innerText = p.title;
        if (p.id === appState.weddingId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    if (appState.userRole === "super_admin") {
        selector.classList.remove("hidden");
        document.getElementById("nav-superadmin").classList.remove("hidden");
    } else {
        selector.classList.add("hidden");
        document.getElementById("nav-superadmin").classList.add("hidden");
    }
}

function superadminSwitchProject(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) return;

    // Load data for selected project
    appState.weddingId = project.id;
    appState.budgetLimit = project.budgetLimit;
    appState.gasApiUrl = project.gasApiUrl;
    loadProjectData(projectId);

    // Update UI title and badges
    document.getElementById("wedding-title").innerText = project.title;
    updateSyncBadge();

    // Ensure selector values are synced
    const selector = document.getElementById("superadmin-project-selector");
    if (selector) selector.value = projectId;

    // Update active project in roles manager
    saActiveProjectId = projectId;

    // Switch view to workspace
    switchTab("workspace");
    showToast(`Beralih ke workspace ${project.title}`, "success");
}

function openCreateProjectModal() {
    document.getElementById("sa-project-id-input").value = "";
    document.getElementById("sa-project-title-input").value = "";
    document.getElementById("sa-project-budget-input").value = "300000000";
    document.getElementById("sa-project-date-input").value = "";
    document.getElementById("sa-project-gas-input").value = "";
    document.getElementById("sa-project-seed-checkbox").checked = true;
    document.getElementById("sa-seed-option-container").classList.remove("hidden");

    document.getElementById("sa-project-modal-title").innerText = "Buat Proyek Baru";
    document.getElementById("sa-project-modal").classList.remove("hidden");
}

function closeCreateProjectModal() {
    document.getElementById("sa-project-modal").classList.add("hidden");
}

function editsaProject(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) return;

    document.getElementById("sa-project-id-input").value = project.id;
    document.getElementById("sa-project-title-input").value = project.title;
    document.getElementById("sa-project-budget-input").value = project.budgetLimit;
    document.getElementById("sa-project-date-input").value = project.targetDate;
    document.getElementById("sa-project-gas-input").value = project.gasApiUrl || "";
    document.getElementById("sa-seed-option-container").classList.add("hidden");

    document.getElementById("sa-project-modal-title").innerText = "Ubah Proyek Client";
    document.getElementById("sa-project-modal").classList.remove("hidden");
}

function deletesaProject(projectId) {
    if (confirm(`Apakah Anda yakin ingin menghapus proyek "${projectId}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`)) {
        // Remove project from appState.projects
        const idx = appState.projects.findIndex(p => p.id === projectId);
        if (idx === -1) return;
        
        const title = appState.projects[idx].title;
        appState.projects.splice(idx, 1);
        
        // Save projects list
        localStorage.setItem("aura_projects_list", JSON.stringify(appState.projects));

        // Delete project data from localStorage
        localStorage.removeItem(`aura_project_${projectId}_tasks`);
        localStorage.removeItem(`aura_project_${projectId}_guests`);
        localStorage.removeItem(`aura_project_${projectId}_payments`);
        localStorage.removeItem(`aura_project_${projectId}_vendors`);
        localStorage.removeItem(`aura_project_${projectId}_logs`);

        showToast(`Proyek ${title} berhasil dihapus.`, "info");

        // Reset active projects if necessary
        if (saActiveProjectId === projectId) {
            saActiveProjectId = appState.projects.length > 0 ? appState.projects[0].id : "";
        }
        if (appState.weddingId === projectId) {
            if (appState.projects.length > 0) {
                superadminSwitchProject(appState.projects[0].id);
            } else {
                // If no projects left, log out
                handleLogout();
                return;
            }
        }

        renderSuperadminGlobalSwitcher();
        renderSuperadminPanel();
    }
}

function handleCreateProjectSubmit(e) {
    e.preventDefault();

    const idInput = document.getElementById("sa-project-id-input").value;
    const title = document.getElementById("sa-project-title-input").value.trim();
    const budget = parseFloat(document.getElementById("sa-project-budget-input").value);
    const date = document.getElementById("sa-project-date-input").value;
    const gasUrl = document.getElementById("sa-project-gas-input").value.trim();
    const seedDemo = document.getElementById("sa-project-seed-checkbox").checked;

    if (!title || isNaN(budget) || !date) {
        showToast("Lengkapi semua field wajib!", "error");
        return;
    }

    if (idInput) {
        // EDIT MODE
        const project = appState.projects.find(p => p.id === idInput);
        if (project) {
            project.title = title;
            project.budgetLimit = budget;
            project.targetDate = date;
            project.gasApiUrl = gasUrl;

            // Save to local storage
            localStorage.setItem("aura_projects_list", JSON.stringify(appState.projects));
            
            // If active, update active project in memory
            if (appState.weddingId === idInput) {
                appState.budgetLimit = budget;
                appState.gasApiUrl = gasUrl;
                document.getElementById("wedding-title").innerText = title;
                updateSyncBadge();
            }

            showToast(`Proyek ${title} berhasil diperbarui!`, "success");
        }
    } else {
        // CREATE MODE
        const newId = "WD-AURA-" + Math.floor(100 + Math.random() * 900);
        
        // Generate default template roles for the new project
        const domain = title.toLowerCase().replace(/[^a-z0-9]/g, "") || "client";
        const defaultRoles = [
            {
                roleName: "client_decider",
                label: "Decider",
                email: `decider@${domain}.com`,
                password: "123456",
                permissions: {
                    canEditVendor: true,
                    canEditBudget: true,
                    canEditMilestone: true,
                    canVerifyPayment: true
                }
            },
            {
                roleName: "client_initiator",
                label: "Initiator",
                email: `initiator@${domain}.com`,
                password: "123456",
                permissions: {
                    canEditVendor: true,
                    canEditBudget: false,
                    canEditMilestone: false,
                    canVerifyPayment: false
                }
            },
            {
                roleName: "wedding_planner",
                label: "Planner",
                email: `planner@${domain}.com`,
                password: "123456",
                permissions: {
                    canEditVendor: true,
                    canEditBudget: true,
                    canEditMilestone: true,
                    canVerifyPayment: false
                }
            }
        ];

        const newProject = {
            id: newId,
            title: title,
            targetDate: date,
            budgetLimit: budget,
            gasApiUrl: gasUrl,
            roles: defaultRoles
        };

        appState.projects.push(newProject);
        localStorage.setItem("aura_projects_list", JSON.stringify(appState.projects));

        // Setup Isolated Storage
        const tasks = seedDemo ? [...defaultTasks] : [];
        const guests = seedDemo ? [...defaultGuests] : [];
        const vendors = seedDemo ? [...defaultVendorList] : [];
        const logs = seedDemo ? [
            { tanggal: new Date(), user: "admin@aurawedding.com", aktivitas: "CREATE_PROJ", detail: `Inisialisasi proyek baru ${title}` }
        ] : [];
        const payments = [];

        localStorage.setItem(`aura_project_${newId}_tasks`, JSON.stringify(tasks));
        localStorage.setItem(`aura_project_${newId}_guests`, JSON.stringify(guests));
        localStorage.setItem(`aura_project_${newId}_payments`, JSON.stringify(payments));
        localStorage.setItem(`aura_project_${newId}_vendors`, JSON.stringify(vendors));
        localStorage.setItem(`aura_project_${newId}_logs`, JSON.stringify(logs));

        saActiveProjectId = newId;
        showToast(`Proyek ${title} sukses dibuat!`, "success");
    }

    closeCreateProjectModal();
    renderSuperadminGlobalSwitcher();
    renderSuperadminPanel();
}

function renderSaRoles() {
    const container = document.getElementById("sa-roles-container");
    const panelTitle = document.getElementById("sa-role-panel-title");
    const panelDesc = document.getElementById("sa-role-panel-desc");

    if (!container) return;

    if (!saActiveProjectId) {
        container.innerHTML = `<div class="text-center py-8 text-xs text-[#7a7a7a]">Pilih proyek client terlebih dahulu.</div>`;
        panelTitle.innerHTML = `<i class="fa-solid fa-user-shield mr-2 text-purple-600"></i> Pengaturan Peran`;
        panelDesc.innerText = "Pilih salah satu proyek di kiri untuk mengedit daftar peran & hak akses penggunanya.";
        return;
    }

    const project = appState.projects.find(p => p.id === saActiveProjectId);
    if (!project) {
        container.innerHTML = `<div class="text-center py-8 text-xs text-[#7a7a7a]">Proyek tidak ditemukan.</div>`;
        return;
    }

    panelTitle.innerHTML = `<i class="fa-solid fa-user-shield mr-2 text-purple-600"></i> Peran: ${project.title}`;
    panelDesc.innerText = `Mengelola kredensial dan hak akses untuk proyek ${project.id}.`;

    container.innerHTML = "";

    if (!project.roles || project.roles.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-xs text-[#7a7a7a]">Belum ada peran/user terdaftar. Klik tombol tambah di atas.</div>`;
        return;
    }

    project.roles.forEach(role => {
        const item = document.createElement("div");
        item.className = "p-4 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0] text-xs space-y-2.5 hover:border-purple-300 transition duration-300";
        
        // Badges for permissions
        let permBadges = [];
        if (role.permissions.canEditVendor) permBadges.push(`<span class="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold">Vendor</span>`);
        if (role.permissions.canEditBudget) permBadges.push(`<span class="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold">Budget</span>`);
        if (role.permissions.canEditMilestone) permBadges.push(`<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold">Milestone</span>`);
        if (role.permissions.canVerifyPayment) permBadges.push(`<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold">Verify</span>`);

        if (permBadges.length === 0) {
            permBadges.push(`<span class="bg-gray-100 text-gray-400 border border-gray-200 text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold">No Perms</span>`);
        }

        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <span class="font-bold text-sm text-[#1d1d1f] block">${role.label}</span>
                    <span class="text-[10px] text-[#7a7a7a] font-mono">${role.email}</span>
                </div>
                <div class="flex items-center space-x-1.5">
                    <button onclick="editsaRole('${role.email}')" class="active-scale w-6 h-6 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center text-gray-500 hover:text-purple-600 transition" title="Edit Peran">
                        <i class="fa-solid fa-pen text-[10px]"></i>
                    </button>
                    <button onclick="deletesaRole('${role.email}')" class="active-scale w-6 h-6 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center text-gray-500 hover:text-rose-600 transition" title="Hapus Peran">
                        <i class="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </div>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-[#e0e0e0] text-[10px]">
                <span class="text-[#7a7a7a]">Token: <span class="font-mono font-bold text-[#1d1d1f]">${role.password}</span></span>
                <span class="font-semibold text-purple-600 uppercase text-[9px] tracking-wider bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-[4px]">${role.roleName}</span>
            </div>
            <div class="flex flex-wrap gap-1 mt-1">
                ${permBadges.join("")}
            </div>
        `;
        container.appendChild(item);
    });
}

function openAddRoleModal() {
    if (!saActiveProjectId) {
        showToast("Pilih proyek client terlebih dahulu!", "error");
        return;
    }

    document.getElementById("sa-role-original-email").value = "";
    document.getElementById("sa-role-name-input").value = "custom";
    document.getElementById("sa-role-label-input").value = "";
    document.getElementById("sa-role-email-input").value = "";
    document.getElementById("sa-role-password-input").value = "";
    
    document.getElementById("sa-perm-vendor").checked = false;
    document.getElementById("sa-perm-budget").checked = false;
    document.getElementById("sa-perm-milestone").checked = false;
    document.getElementById("sa-perm-verify").checked = false;

    document.getElementById("sa-role-modal-title").innerText = "Tambah Peran Baru";
    document.getElementById("sa-role-modal").classList.remove("hidden");
}

function closeAddRoleModal() {
    document.getElementById("sa-role-modal").classList.add("hidden");
}

function prefillPermissionsByRole(roleName) {
    const permVendor = document.getElementById("sa-perm-vendor");
    const permBudget = document.getElementById("sa-perm-budget");
    const permMilestone = document.getElementById("sa-perm-milestone");
    const permVerify = document.getElementById("sa-perm-verify");
    const labelInput = document.getElementById("sa-role-label-input");

    if (roleName === "client_decider") {
        permVendor.checked = true;
        permBudget.checked = true;
        permMilestone.checked = true;
        permVerify.checked = true;
        labelInput.value = "Decider";
    } else if (roleName === "client_initiator") {
        permVendor.checked = true;
        permBudget.checked = false;
        permMilestone.checked = false;
        permVerify.checked = false;
        labelInput.value = "Initiator";
    } else if (roleName === "wedding_planner") {
        permVendor.checked = true;
        permBudget.checked = true;
        permMilestone.checked = true;
        permVerify.checked = false;
        labelInput.value = "Planner";
    } else {
        permVendor.checked = false;
        permBudget.checked = false;
        permMilestone.checked = false;
        permVerify.checked = false;
        labelInput.value = "Custom Role";
    }
}

function editsaRole(email) {
    const project = appState.projects.find(p => p.id === saActiveProjectId);
    if (!project) return;

    const role = project.roles.find(r => r.email.toLowerCase() === email.toLowerCase());
    if (!role) return;

    document.getElementById("sa-role-original-email").value = role.email;
    document.getElementById("sa-role-name-input").value = role.roleName;
    document.getElementById("sa-role-label-input").value = role.label;
    document.getElementById("sa-role-email-input").value = role.email;
    document.getElementById("sa-role-password-input").value = role.password;

    document.getElementById("sa-perm-vendor").checked = !!role.permissions.canEditVendor;
    document.getElementById("sa-perm-budget").checked = !!role.permissions.canEditBudget;
    document.getElementById("sa-perm-milestone").checked = !!role.permissions.canEditMilestone;
    document.getElementById("sa-perm-verify").checked = !!role.permissions.canVerifyPayment;

    document.getElementById("sa-role-modal-title").innerText = "Ubah Otoritas Peran";
    document.getElementById("sa-role-modal").classList.remove("hidden");
}

function deletesaRole(email) {
    const project = appState.projects.find(p => p.id === saActiveProjectId);
    if (!project) return;

    if (confirm(`Apakah Anda yakin ingin menghapus peran dengan email "${email}"?`)) {
        const idx = project.roles.findIndex(r => r.email.toLowerCase() === email.toLowerCase());
        if (idx === -1) return;

        project.roles.splice(idx, 1);
        localStorage.setItem("aura_projects_list", JSON.stringify(appState.projects));
        
        showToast("Peran berhasil dihapus.", "info");
        renderSaRoles();
    }
}

function handleRoleSubmit(e) {
    e.preventDefault();

    const originalEmail = document.getElementById("sa-role-original-email").value.trim();
    const roleName = document.getElementById("sa-role-name-input").value;
    const label = document.getElementById("sa-role-label-input").value.trim();
    const email = document.getElementById("sa-role-email-input").value.trim().toLowerCase();
    const password = document.getElementById("sa-role-password-input").value.trim();

    const canEditVendor = document.getElementById("sa-perm-vendor").checked;
    const canEditBudget = document.getElementById("sa-perm-budget").checked;
    const canEditMilestone = document.getElementById("sa-perm-milestone").checked;
    const canVerifyPayment = document.getElementById("sa-perm-verify").checked;

    if (!saActiveProjectId) return;

    const project = appState.projects.find(p => p.id === saActiveProjectId);
    if (!project) return;

    const newRole = {
        roleName: roleName,
        label: label,
        email: email,
        password: password,
        permissions: {
            canEditVendor: canEditVendor,
            canEditBudget: canEditBudget,
            canEditMilestone: canEditMilestone,
            canVerifyPayment: canVerifyPayment
        }
    };

    if (originalEmail) {
        // EDIT MODE
        const role = project.roles.find(r => r.email.toLowerCase() === originalEmail.toLowerCase());
        if (role) {
            if (originalEmail.toLowerCase() !== email && project.roles.some(r => r.email.toLowerCase() === email)) {
                showToast("Email sudah digunakan oleh peran lain di proyek ini!", "error");
                return;
            }

            role.roleName = roleName;
            role.label = label;
            role.email = email;
            role.password = password;
            role.permissions = newRole.permissions;

            showToast("Peran berhasil diperbarui!", "success");
        }
    } else {
        // ADD MODE
        if (project.roles.some(r => r.email.toLowerCase() === email)) {
            showToast("Email sudah digunakan di proyek ini!", "error");
            return;
        }

        project.roles.push(newRole);
        showToast("Peran baru berhasil ditambahkan!", "success");
    }

    localStorage.setItem("aura_projects_list", JSON.stringify(appState.projects));
    closeAddRoleModal();
    renderSaRoles();
}
