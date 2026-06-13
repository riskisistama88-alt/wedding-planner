window.onload = function() {
    // Load projects list first using robust helper function
    appState.projects = getLocalStorageArray("aura_projects_list", [...defaultProjectsList]);
    
    // Check and update GAS URL for default project if needed
    const defaultProj = appState.projects.find(p => p.id === "WD-AURA-002");
    if (defaultProj && (!defaultProj.gasApiUrl || defaultProj.gasApiUrl === "")) {
        defaultProj.gasApiUrl = "https://script.google.com/macros/s/AKfycbyve5t4AnFkZjlzYJ-PNX610aNgFD8fsSYJg60APHMshT6hBgZhrK-2GHxdIv8JCxnsig/exec";
        localStorage.setItem("aura_projects_list", JSON.stringify(appState.projects));
    }

    // Check Session in LocalStorage
    const localSession = localStorage.getItem("aura_session");
    const savedGasUrl = localStorage.getItem("aura_gas_url");
    const savedGeminiKey = localStorage.getItem("aura_gemini_api_key");
    
    if (savedGasUrl) {
        appState.gasApiUrl = savedGasUrl;
        document.getElementById("gas-deployed-url").value = savedGasUrl;
    } else {
        // Fallback: Bind to the new active GAS URL directly
        appState.gasApiUrl = "https://script.google.com/macros/s/AKfycbyve5t4AnFkZjlzYJ-PNX610aNgFD8fsSYJg60APHMshT6hBgZhrK-2GHxdIv8JCxnsig/exec";
        localStorage.setItem("aura_gas_url", appState.gasApiUrl);
    }

    if (savedGeminiKey) {
        appState.geminiApiKey = savedGeminiKey;
        const keyInput = document.getElementById("gemini-api-key-input");
        if (keyInput) keyInput.value = savedGeminiKey;
    } else {
        appState.geminiApiKey = "";
        const keyInput = document.getElementById("gemini-api-key-input");
        if (keyInput) keyInput.value = "";
    }

    if (localSession) {
        const parsed = JSON.parse(localSession);
        appState.isLoggedIn = true;
        appState.userEmail = parsed.email;
        appState.userRole = parsed.role;
        appState.weddingId = parsed.weddingId || "WD-AURA-002";
        document.getElementById("auth-portal").classList.add("hidden");
        initializeWorkspace();
    } else {
        document.getElementById("auth-portal").classList.remove("hidden");
    }
};

function initializeWorkspace() {
    // Restore session
    const localSession = localStorage.getItem("aura_session");
    if (localSession) {
        const parsed = JSON.parse(localSession);
        appState.userEmail = parsed.email;
        appState.userRole = parsed.role;
        appState.weddingId = parsed.weddingId || "WD-AURA-002";
    }

    // Enforce Superadmin setup or Client Project setup
    if (appState.userRole === "super_admin") {
        document.getElementById("user-badge").innerText = "Superadmin";
        document.getElementById("display-email").innerText = appState.userEmail;
        document.getElementById("wedding-title").innerText = "AURA - Superadmin Console";
        
        // Hide normal views, show Superadmin view
        switchTab("superadmin");
        
        // Initialize global switcher dropdown
        renderSuperadminGlobalSwitcher();
        
        startPresenceSimulation();
        return;
    }

    // Regular Client Workspace load
    const currentProject = appState.projects.find(p => p.id === appState.weddingId);
    if (!currentProject) {
        // If the project was deleted or doesn't exist, log out
        handleLogout();
        return;
    }

    // Hide superadmin nav and switcher for regular client
    document.getElementById("nav-superadmin").classList.add("hidden");
    document.getElementById("superadmin-project-selector").classList.add("hidden");

    document.getElementById("display-email").innerText = appState.userEmail;
    document.getElementById("user-badge").innerText = getActiveRoleLabel();
    document.getElementById("wedding-title").innerText = currentProject.title;
    
    // Set gasApiUrl
    appState.gasApiUrl = currentProject.gasApiUrl;
    updateSyncBadge();

    // Load data for this specific project
    loadProjectData(appState.weddingId);

    // Render workspace
    renderWorkspace();
    
    // Switch to workspace tab for regular client
    switchTab("workspace");
    
    // Start simulation
    startPresenceSimulation();
}

function switchTab(tabName) {
    const workspaceView = document.getElementById("workspace-view");
    const motherboardView = document.getElementById("motherboard-view");
    const ldrhubView = document.getElementById("ldrhub-view");
    const superadminView = document.getElementById("superadmin-view");
    const navWorkspace = document.getElementById("nav-workspace");
    const navMotherboard = document.getElementById("nav-motherboard");
    const navLdrhub = document.getElementById("nav-ldrhub");
    const navSuperadmin = document.getElementById("nav-superadmin");

    // Route Protection: Prevent regular clients from accessing Superadmin view
    if (tabName === "superadmin" && appState.userRole !== "super_admin") {
        tabName = "workspace";
    }

    // Hide all views
    if (workspaceView) workspaceView.classList.add("hidden");
    if (motherboardView) motherboardView.classList.add("hidden");
    if (ldrhubView) ldrhubView.classList.add("hidden");
    if (superadminView) superadminView.classList.add("hidden");

    // Helper to safely toggle active/inactive tab styles without overwriting other utility classes (like hidden)
    const setTabStyle = (el, isActive) => {
        if (!el) return;
        if (isActive) {
            el.classList.add("text-white", "font-semibold");
            el.classList.remove("text-[#cccccc]");
        } else {
            el.classList.remove("text-white", "font-semibold");
            el.classList.add("text-[#cccccc]");
        }
    };

    setTabStyle(navWorkspace, tabName === "workspace");
    setTabStyle(navMotherboard, tabName === "motherboard");
    setTabStyle(navLdrhub, tabName === "ldrhub");
    setTabStyle(navSuperadmin, tabName === "superadmin");

    const mobWorkspace = document.getElementById("mob-nav-workspace");
    const mobMotherboard = document.getElementById("mob-nav-motherboard");
    const mobLdrhub = document.getElementById("mob-nav-ldrhub");
    const mobSuperadmin = document.getElementById("mob-nav-superadmin");

    const setMobTabStyle = (el, isActive) => {
        if (!el) return;
        if (isActive) {
            el.classList.add("text-[#2997ff]");
            el.classList.remove("text-white");
        } else {
            el.classList.remove("text-[#2997ff]");
            el.classList.add("text-white");
        }
    };

    setMobTabStyle(mobWorkspace, tabName === "workspace");
    setMobTabStyle(mobMotherboard, tabName === "motherboard");
    setMobTabStyle(mobLdrhub, tabName === "ldrhub");
    setMobTabStyle(mobSuperadmin, tabName === "superadmin");

    // Explicitly enforce Superadmin menu item visibility based on active session role
    if (navSuperadmin) {
        if (appState.userRole === "super_admin") {
            navSuperadmin.classList.remove("hidden");
        } else {
            navSuperadmin.classList.add("hidden");
        }
    }

    // Activate the selected view
    if (tabName === "workspace") {
        if (workspaceView) workspaceView.classList.remove("hidden");
        renderWorkspace();
    } else if (tabName === "motherboard") {
        if (motherboardView) motherboardView.classList.remove("hidden");
        renderMotherboardDashboard();
    } else if (tabName === "ldrhub") {
        if (ldrhubView) ldrhubView.classList.remove("hidden");
        renderLdrHub();
    } else if (tabName === "superadmin") {
        if (superadminView) superadminView.classList.remove("hidden");
        renderSuperadminPanel();
    }
}

function toggleMobileMenu() {
    const overlay = document.getElementById("mobile-nav-overlay");
    if (!overlay) return;
    overlay.classList.toggle("hidden");
    
    // Sync email and badge in mobile overlay
    if (!overlay.classList.contains("hidden")) {
        const email = document.getElementById("display-email").innerText;
        const badge = document.getElementById("user-badge").innerText;
        
        document.getElementById("mob-display-email").innerText = email;
        document.getElementById("mob-user-badge").innerText = badge;
        
        // Handle Superadmin Panel link visibility in mobile nav
        const mobNavSuperadmin = document.getElementById("mob-nav-superadmin");
        if (mobNavSuperadmin) {
            if (appState.userRole === "super_admin") {
                mobNavSuperadmin.classList.remove("hidden");
            } else {
                mobNavSuperadmin.classList.add("hidden");
            }
        }
    }
}

function mobileSwitchTab(tabName) {
    switchTab(tabName);
    toggleMobileMenu();
}

let presenceInterval = null;
function startPresenceSimulation() {
    if (presenceInterval) clearInterval(presenceInterval);
    
    const activities = [
        { user: "tama.decider@sg-corp.com", name: "Tama", text: "sedang meninjau anggaran katering..." },
        { user: "wp_planner@aurawedding.com", name: "Aura WO", text: "memperbarui susunan acara (rundown) Lamaran..." },
        { user: "indah.adr@gmail.com", name: "Indah", text: "sedang mencari alternatif foto dekorasi earth tone..." },
        { user: "tama.decider@sg-corp.com", name: "Tama", text: "menyetujui alur kerja WO Dienisa MC..." },
        { user: "wp_planner@aurawedding.com", name: "Aura WO", text: "menambahkan catatan teknis pada Aula Badarusamsi..." }
    ];

    presenceInterval = setInterval(() => {
        if (!appState.isLoggedIn) return;
        
        const statuses = ["Online", "Away", "Busy"];
        const indahStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const tamaStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const woStatus = statuses[Math.floor(Math.random() * statuses.length)];

        updatePresenceUI("indah", indahStatus);
        updatePresenceUI("tama", tamaStatus);
        updatePresenceUI("wo", woStatus);

        const randomAct = activities[Math.floor(Math.random() * activities.length)];
        showToast(`${randomAct.name}: ${randomAct.text}`, "info");

        const simulatedLog = {
            tanggal: new Date(),
            user: randomAct.user,
            aktivitas: "LIVE_COLLAB",
            detail: `${randomAct.name} ${randomAct.text}`
        };
        
        appState.logs.unshift(simulatedLog);
        renderLogs();
    }, 60000); // Trigger every 60 seconds
}

function updatePresenceUI(userId, status) {
    const indicator = document.getElementById(`user-status-${userId}`);
    if (!indicator) return;
    
    if (status === "Online") {
        indicator.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
        indicator.title = "Sedang Aktif";
    } else if (status === "Away") {
        indicator.className = "w-2 h-2 rounded-full bg-amber-400";
        indicator.title = "Away";
    } else {
        indicator.className = "w-2 h-2 rounded-full bg-gray-300";
        indicator.title = "Offline";
    }
}

function toggleActivityLog() {
    const drawer = document.getElementById("activity-log-drawer");
    const container = document.getElementById("drawer-container");
    if (!drawer || !container) return;
    
    if (drawer.classList.contains("hidden")) {
        drawer.classList.remove("hidden");
        setTimeout(() => {
            container.classList.remove("translate-x-full");
        }, 10);
    } else {
        container.classList.add("translate-x-full");
        setTimeout(() => {
            drawer.classList.add("hidden");
        }, 300);
    }
}

function renderLogs() {
    const container = document.getElementById("activity-logs-container");
    if (!container) return;
    container.innerHTML = "";

    if (appState.logs.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-xs text-[#7a7a7a]">Belum ada riwayat aktivitas log.</div>`;
        return;
    }

    appState.logs.forEach(log => {
        const row = document.createElement("div");
        row.className = "p-4 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0] text-xs space-y-1.5";
        
        let icon = `<i class="fa-solid fa-file-pen text-blue-500"></i>`;
        if (log.aktivitas === "STATUS_UPDATE") icon = `<i class="fa-solid fa-arrows-spin text-purple-500"></i>`;
        else if (log.aktivitas === "DELETE_VND") icon = `<i class="fa-solid fa-trash-can text-rose-500"></i>`;
        
        const timeString = new Date(log.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const dateString = new Date(log.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        row.innerHTML = `
            <div class="flex items-center justify-between font-semibold">
                <span class="flex items-center space-x-1.5">
                    ${icon}
                    <span class="text-[#1d1d1f]">${log.aktivitas}</span>
                </span>
                <span class="text-[10px] text-[#7a7a7a]">${dateString}, ${timeString}</span>
            </div>
            <p class="text-[#1d1d1f]">${log.detail}</p>
            <span class="text-[10px] text-[#7a7a7a] block font-mono text-right">&mdash; ${log.user}</span>
        `;
        container.appendChild(row);
    });
}

function toggleDeveloperConsole() {
    const modal = document.getElementById("dev-console-modal");
    if (modal) modal.classList.toggle("hidden");
}

function copyGasCode() {
    const codeBlock = document.getElementById("gas-code-block");
    if (!codeBlock) return;
    
    const fullGasCode = `/*
  =============================================================================
  AURA INTEGRATED GOOGLE APPS SCRIPT (GAS) WEB APP ENGINE
  =============================================================================
  Salin kode ini ke editor Extensions > Apps Script pada Google Sheets Anda.
  Instalasi setupDatabase() otomatis akan membuat 3 Sheets yang dibutuhkan.
  Gunakan Type: Web App, Execute as: Me, Access: Anyone untuk deployment.
*/

const SPREADSHEET_ID = "GANTI_DENGAN_SPREADSHEET_ID_ANDA";

function doGet(e) {
  const action = e.parameter.action;
  const weddingId = e.parameter.wedding_id;
  
  if (action === "getVendorCatalog") {
    return handleGetVendorCatalog(weddingId);
  } else if (action === "getBudgetSummary") {
    return handleGetBudgetSummary(weddingId);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: false, message: "Invalid GET Action"}))
                       .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const action = payload.action;
  
  if (action === "login") {
    return handleLogin(payload.email, payload.token);
  } else if (action === "addVendor") {
    return handleAddVendor(payload);
  } else if (action === "updateVendorStatus") {
    return handleUpdateVendorStatus(payload);
  } else if (action === "deleteVendor") {
    return handleDeleteVendor(payload);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: false, message: "Invalid POST Action"}))
                       .setMimeType(ContentService.MimeType.JSON);
}

function handleGetVendorCatalog(weddingId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Sheet_Utama");
  const data = sheet.getDataRange().getValues();
  
  const vendors = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === "VendorCatalog" && data[i][3] !== "Deleted") {
      const payload = JSON.parse(data[i][4]);
      if (payload.wedding_id === weddingId) {
        vendors.push(payload);
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, data: vendors}))
                       .setMimeType(ContentService.MimeType.JSON);
}

function handleAddVendor(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetUtama = ss.getSheetByName("Sheet_Utama");
  const sheetLog = ss.getSheetByName("Sheet_Log");
  const sheetRekap = ss.getSheetByName("Sheet_Rekap");
  
  const vendorId = "VND-" + Math.floor(1000 + Math.random() * 9000);
  const newVendor = {
    vendor_id: vendorId,
    wedding_id: payload.wedding_id,
    category: payload.category,
    vendor_name: payload.vendor_name,
    package_name: payload.package_name,
    price: payload.price,
    notes: payload.notes,
    file_url: payload.file_url,
    status: "Draft"
  };
  
  sheetUtama.appendRow([
    new Date(),
    vendorId,
    "VendorCatalog",
    "Draft",
    JSON.stringify(newVendor),
    payload.file_url,
    payload.user_email,
    new Date()
  ]);
  
  sheetRekap.appendRow([
    vendorId,
    payload.category,
    payload.vendor_name,
    payload.package_name,
    payload.price,
    payload.notes,
    "Draft"
  ]);
  
  sheetLog.appendRow([
    new Date(),
    payload.user_email,
    "CREATE_VND",
    "Mengusulkan vendor baru: " + payload.vendor_name
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true, vendor_id: vendorId}))
                       .setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateVendorStatus(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetUtama = ss.getSheetByName("Sheet_Utama");
  const sheetRekap = ss.getSheetByName("Sheet_Rekap");
  const sheetLog = ss.getSheetByName("Sheet_Log");
  
  const rangeUtama = sheetUtama.getDataRange();
  const valuesUtama = rangeUtama.getValues();
  for (let i = 1; i < valuesUtama.length; i++) {
    if (valuesUtama[i][1] === payload.vendor_id) {
      sheetUtama.getRange(i + 1, 4).setValue(payload.new_status);
      sheetUtama.getRange(i + 1, 8).setValue(new Date());
      
      const details = JSON.parse(valuesUtama[i][4]);
      details.status = payload.new_status;
      sheetUtama.getRange(i + 1, 5).setValue(JSON.stringify(details));
      break;
    }
  }
  
  const rangeRekap = sheetRekap.getDataRange();
  const valuesRekap = rangeRekap.getValues();
  for (let i = 6; i < valuesRekap.length; i++) {
    if (valuesRekap[i][0] === payload.vendor_id) {
      sheetRekap.getRange(i + 1, 7).setValue(payload.new_status);
      break;
    }
  }
  
  sheetLog.appendRow([
    new Date(),
    payload.user_email,
    "STATUS_UPDATE",
    "Mengubah status " + payload.vendor_id + " menjadi " + payload.new_status
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
                       .setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteVendor(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetUtama = ss.getSheetByName("Sheet_Utama");
  const sheetRekap = ss.getSheetByName("Sheet_Rekap");
  const sheetLog = ss.getSheetByName("Sheet_Log");
  
  const rangeUtama = sheetUtama.getDataRange();
  const valuesUtama = rangeUtama.getValues();
  for (let i = 1; i < valuesUtama.length; i++) {
    if (valuesUtama[i][1] === payload.vendor_id) {
      sheetUtama.getRange(i + 1, 4).setValue("Deleted");
      break;
    }
  }
  
  const rangeRekap = sheetRekap.getDataRange();
  const valuesRekap = rangeRekap.getValues();
  for (let i = 6; i < valuesRekap.length; i++) {
    if (valuesRekap[i][0] === payload.vendor_id) {
      sheetRekap.deleteRow(i + 1);
      break;
    }
  }
  
  sheetLog.appendRow([
    new Date(),
    payload.user_email,
    "DELETE_VND",
    "Menghapus vendor " + payload.vendor_id
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
                       .setMimeType(ContentService.MimeType.JSON);
}
`;
    
    const dummyTextArea = document.createElement("textarea");
    dummyTextArea.value = fullGasCode;
    document.body.appendChild(dummyTextArea);
    dummyTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(dummyTextArea);
    
    showToast("Kode Google Apps Script berhasil disalin!", "success");
}

function saveGasUrl() {
    const url = document.getElementById("gas-deployed-url").value;
    if (url) {
        appState.gasApiUrl = url;
        localStorage.setItem("aura_gas_url", url);
        showToast("Berhasil Menghubungkan Backend GAS secara Live!", "success");
        fetchDataFromGas();
        toggleDeveloperConsole();
    } else {
        showToast("Harap masukkan URL Web App yang valid.", "error");
    }
}

function fetchDataFromGas() {
    if (!appState.gasApiUrl) return;

    showToast("Menghubungkan & Membaca Motherboard Live...", "info");
    
    fetch(`${appState.gasApiUrl}?action=getVendorCatalog&wedding_id=${appState.weddingId}`)
        .then(res => res.json())
        .then(response => {
            if (response.success && response.data) {
                appState.vendors = response.data;
                renderWorkspace();
                showToast("Sinkronisasi Sukses!", "success");
            }
        })
        .catch(err => {
            console.error(err);
            showToast("Gagal mengambil data Live, kembali ke Mode Simulasi.", "error");
            appState.vendors = [...defaultVendorList];
            renderWorkspace();
        });
}

function postToGas(payload) {
    if (!appState.gasApiUrl) return;
    
    fetch(appState.gasApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
        if(res.success) {
            showToast("Database Terpusat Sukses Disinkronkan!", "success");
        }
    })
    .catch(err => {
        console.error("GAS Sync Error: ", err);
    });
}

// =========================================================================
// GEMINI AI API KEY & COMPARISON ANALYSIS HANDLERS
// =========================================================================

function saveGeminiApiKey() {
    const key = document.getElementById("gemini-api-key-input").value.trim();
    if (key) {
        appState.geminiApiKey = key;
        localStorage.setItem("aura_gemini_api_key", key);
        showToast("Gemini AI API Key berhasil disimpan!", "success");
    } else {
        appState.geminiApiKey = "";
        localStorage.removeItem("aura_gemini_api_key");
        showToast("Gemini AI API Key dihapus.", "info");
    }
}

function triggerGeminiAnalysis() {
    if (!appState.geminiApiKey) {
        showToast("Gemini API Key belum dikonfigurasi! Buka menu 'Setup GAS & AI' untuk menyimpannya.", "error");
        return;
    }

    const categoryVendors = appState.vendors.filter(v => v.category === appState.activeCategory);
    if (categoryVendors.length < 2) {
        showToast(`Minimal harus ada 2 alternatif vendor di kategori ${appState.activeCategory} untuk dibandingkan!`, "error");
        return;
    }

    const btn = document.getElementById("btn-gemini-analyze");
    const resultDiv = document.getElementById("gemini-analysis-result");

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1.5"></i> Menganalisis...`;
    }

    let vendorListText = "";
    categoryVendors.forEach((v, index) => {
        vendorListText += `Alternatif Vendor ${index + 1}:\n- Nama Vendor: ${v.vendor_name}\n- Paket Layanan: ${v.package_name}\n- Harga Paket: Rp${v.price.toLocaleString('id-ID')}\n- Catatan Teknis: ${v.notes || 'Tidak ada catatan khusus.'}\n\n`;
    });

    const prompt = `Anda adalah Asisten Virtual Wedding Planner AI Premium. Tolong buatkan perbandingan komparatif dan ulasan rekomendasi untuk alternatif vendor di kategori "${appState.activeCategory}" berikut ini:

${vendorListText}
Ulas secara ringkas dalam format terstruktur:
1. Kelebihan & Kekurangan masing-masing pilihan vendor.
2. Rekomendasi Pilihan Terbaik (Decider Recommendation) berdasarkan nilai value-for-money, harga, catatan teknis, dan kepraktisan.

Jawab dalam Bahasa Indonesia secara sopan, ramah, dan profesional. Gunakan format poin-poin yang mudah dibaca dan tebalkan informasi penting.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${appState.geminiApiKey}`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            let resultText = data.candidates[0].content.parts[0].text;
            
            // Simple markdown parser for bold styling
            resultText = resultText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            resultText = resultText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            if (resultDiv) {
                resultDiv.innerHTML = resultText;
                resultDiv.classList.remove("hidden");
            }
            showToast("Komparasi Gemini AI berhasil dimuat!", "success");
        } else {
            showToast("Respons API tidak valid. Periksa kuota atau status kunci API Anda.", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showToast("Gagal memanggil Gemini API. Periksa koneksi atau validitas API Key Anda.", "error");
    })
    .finally(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i> <span>Analisis Sekarang</span>`;
        }
    });
}
