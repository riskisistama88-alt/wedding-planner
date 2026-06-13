function getLocalStorageArray(key, fallback = []) {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    try {
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch(e) {
        return fallback;
    }
}

function getLocalStorageObject(key, fallback = {}) {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    try {
        const parsed = JSON.parse(item);
        return (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : fallback;
    } catch(e) {
        return fallback;
    }
}

function hasPermission(permissionName) {
    if (appState.userRole === "super_admin") return true;
    
    const currentProject = appState.projects.find(p => p.id === appState.weddingId);
    if (!currentProject) return false;
    
    const roleConfig = currentProject.roles.find(r => r.roleName === appState.userRole && r.email.toLowerCase() === appState.userEmail.toLowerCase());
    if (!roleConfig) return false;
    
    return !!roleConfig.permissions[permissionName];
}

function getActiveRoleLabel() {
    if (appState.userRole === "super_admin") return "Superadmin";
    
    const currentProject = appState.projects.find(p => p.id === appState.weddingId);
    if (!currentProject) return appState.userRole;
    
    const roleConfig = currentProject.roles.find(r => r.roleName === appState.userRole && r.email.toLowerCase() === appState.userEmail.toLowerCase());
    return roleConfig ? roleConfig.label : appState.userRole;
}

function loadProjectData(projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) return;

    appState.weddingId = project.id;
    appState.budgetLimit = project.budgetLimit;
    appState.gasApiUrl = project.gasApiUrl;

    // Seed tasks
    appState.tasks = getLocalStorageArray(`aura_project_${projectId}_tasks`, projectId === "WD-AURA-002" ? [...defaultTasks] : []);

    // Seed guests
    appState.guests = getLocalStorageArray(`aura_project_${projectId}_guests`, projectId === "WD-AURA-002" ? [...defaultGuests] : []);

    // Seed payments
    appState.payments = getLocalStorageArray(`aura_project_${projectId}_payments`, []);

    // Seed vendors & logs
    appState.vendors = getLocalStorageArray(`aura_project_${projectId}_vendors`, projectId === "WD-AURA-002" ? [...defaultVendorList] : []);
    appState.logs = getLocalStorageArray(`aura_project_${projectId}_logs`, projectId === "WD-AURA-002" ? [...defaultLogs] : []);

    // Seed timeline
    appState.timeline = getLocalStorageArray(`aura_project_${projectId}_timeline`, projectId === "WD-AURA-002" ? [...defaultTimeline] : []);

    // Seed venue comparison
    appState.venueComparison = getLocalStorageObject(`aura_project_${projectId}_venue_comparison`, projectId === "WD-AURA-002" ? JSON.parse(JSON.stringify(defaultVenueComparison)) : { venue_a: "Venue A", venue_b: "Venue B", elimination_reason: "", features: [] });
}

function saveProjectData(projectId) {
    localStorage.setItem(`aura_project_${projectId}_tasks`, JSON.stringify(appState.tasks));
    localStorage.setItem(`aura_project_${projectId}_guests`, JSON.stringify(appState.guests));
    localStorage.setItem(`aura_project_${projectId}_payments`, JSON.stringify(appState.payments));
    localStorage.setItem(`aura_project_${projectId}_vendors`, JSON.stringify(appState.vendors));
    localStorage.setItem(`aura_project_${projectId}_logs`, JSON.stringify(appState.logs));
    localStorage.setItem(`aura_project_${projectId}_timeline`, JSON.stringify(appState.timeline));
    localStorage.setItem(`aura_project_${projectId}_venue_comparison`, JSON.stringify(appState.venueComparison));
    
    // Also update project metadata in projects list
    const project = appState.projects.find(p => p.id === projectId);
    if (project) {
        project.budgetLimit = appState.budgetLimit;
        project.gasApiUrl = appState.gasApiUrl;
        localStorage.setItem("aura_projects_list", JSON.stringify(appState.projects));
    }
}

function formatDateToYYYYMMDD(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function parseToYYYYMMDD(dateStr) {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    let cleaned = dateStr.replace(/Jan/gi, 'Jan')
                         .replace(/Peb/gi, 'Feb')
                         .replace(/Feb/gi, 'Feb')
                         .replace(/Mar/gi, 'Mar')
                         .replace(/Apr/gi, 'Apr')
                         .replace(/Mei/gi, 'May')
                         .replace(/Jun/gi, 'Jun')
                         .replace(/Jul/gi, 'Jul')
                         .replace(/Agt/gi, 'Aug')
                         .replace(/Agu/gi, 'Aug')
                         .replace(/Sep/gi, 'Sep')
                         .replace(/Okt/gi, 'Oct')
                         .replace(/Nov/gi, 'Nov')
                         .replace(/Des/gi, 'Dec');
    
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    return "";
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return "-";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const year = parts[0];
        const monthNum = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        return `${day} ${months[monthNum]} ${year}`;
    }
    return dateStr;
}

function vendorNameFromId(vendorId) {
    const v = appState.vendors.find(x => x.vendor_id === vendorId);
    return v ? v.vendor_name : "Unknown Vendor";
}

function getRoleLabelByEmail(email) {
    if (email === "admin@aurawedding.com") return "Superadmin";
    
    const project = appState.projects.find(p => p.id === appState.weddingId);
    if (project && project.roles) {
        const role = project.roles.find(r => r.email.toLowerCase() === email.toLowerCase());
        if (role) return role.label;
    }
    return email;
}
