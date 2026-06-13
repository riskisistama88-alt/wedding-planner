function handleLogin() {
    const emailInput = document.getElementById("auth-email").value.trim().toLowerCase();
    const tokenInput = document.getElementById("auth-token").value;

    if (!emailInput || !tokenInput) {
        showToast("Email & Wedding Token Wajib diisi!", "error");
        return;
    }

    // Check Superadmin Login
    if (emailInput === "admin@aurawedding.com" && tokenInput === "superadmin123") {
        appState.isLoggedIn = true;
        appState.userEmail = emailInput;
        appState.userRole = "super_admin";
        appState.weddingId = "SUPERADMIN";
        
        localStorage.setItem("aura_session", JSON.stringify({
            email: appState.userEmail,
            role: appState.userRole,
            weddingId: appState.weddingId
        }));

        document.getElementById("auth-portal").classList.add("hidden");
        showToast("Selamat Datang, Superadmin!", "success");
        initializeWorkspace();
        return;
    }

    // Regular User Login search across all projects
    let matchedProject = null;
    let matchedRole = null;

    for (const proj of appState.projects) {
        const foundRole = proj.roles.find(r => r.email.toLowerCase() === emailInput && r.password === tokenInput);
        if (foundRole) {
            matchedProject = proj;
            matchedRole = foundRole;
            break;
        }
    }

    if (matchedProject && matchedRole) {
        appState.isLoggedIn = true;
        appState.userEmail = emailInput;
        appState.userRole = matchedRole.roleName;
        appState.weddingId = matchedProject.id;
        
        localStorage.setItem("aura_session", JSON.stringify({
            email: appState.userEmail,
            role: appState.userRole,
            weddingId: appState.weddingId
        }));

        document.getElementById("auth-portal").classList.add("hidden");
        showToast(`Selamat Datang di AURA Workspace untuk ${matchedProject.title}!`, "success");
        initializeWorkspace();
    } else {
        showToast("Email atau Token salah! Periksa kembali kredensial Anda.", "error");
    }
}

function handleLogout() {
    localStorage.removeItem("aura_session");
    appState.isLoggedIn = false;
    
    // Hide Superadmin switcher and nav tab
    document.getElementById("superadmin-project-selector").classList.add("hidden");
    document.getElementById("nav-superadmin").classList.add("hidden");
    
    document.getElementById("auth-portal").classList.remove("hidden");
    showToast("Anda telah keluar dari Sesi Kolaborasi.", "info");
}
