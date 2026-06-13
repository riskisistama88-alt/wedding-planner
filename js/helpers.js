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
    const tasksKey = `aura_project_${projectId}_tasks`;
    appState.tasks = localStorage.getItem(tasksKey) 
        ? JSON.parse(localStorage.getItem(tasksKey)) 
        : (projectId === "WD-AURA-002" ? [...defaultTasks] : []);

    // Seed guests
    const guestsKey = `aura_project_${projectId}_guests`;
    appState.guests = localStorage.getItem(guestsKey) 
        ? JSON.parse(localStorage.getItem(guestsKey)) 
        : (projectId === "WD-AURA-002" ? [...defaultGuests] : []);

    // Seed payments
    const paymentsKey = `aura_project_${projectId}_payments`;
    const savedRaw = localStorage.getItem(paymentsKey);
    let saved = [];
    if (savedRaw) {
        try {
            saved = JSON.parse(savedRaw);
        } catch(e) {
            saved = [];
        }
    } else {
        saved = [];
    }
    appState.payments = saved;

    // Seed vendors & logs
    const vendorsKey = `aura_project_${projectId}_vendors`;
    appState.vendors = localStorage.getItem(vendorsKey)
        ? JSON.parse(localStorage.getItem(vendorsKey))
        : (projectId === "WD-AURA-002" ? [...defaultVendorList] : []);

    const logsKey = `aura_project_${projectId}_logs`;
    appState.logs = localStorage.getItem(logsKey)
        ? JSON.parse(localStorage.getItem(logsKey))
        : (projectId === "WD-AURA-002" ? [...defaultLogs] : []);

    // Seed timeline
    const timelineKey = `aura_project_${projectId}_timeline`;
    appState.timeline = localStorage.getItem(timelineKey)
        ? JSON.parse(localStorage.getItem(timelineKey))
        : (projectId === "WD-AURA-002" ? [...defaultTimeline] : []);

    // Seed venue comparison
    const venueCompKey = `aura_project_${projectId}_venue_comparison`;
    appState.venueComparison = localStorage.getItem(venueCompKey)
        ? JSON.parse(localStorage.getItem(venueCompKey))
        : (projectId === "WD-AURA-002" ? JSON.parse(JSON.stringify(defaultVenueComparison)) : { venue_a: "Venue A", venue_b: "Venue B", elimination_reason: "", features: [] });
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
