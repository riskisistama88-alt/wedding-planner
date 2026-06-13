function renderWorkspace() {
    renderCategoryPills();
    renderBudgetCalculations();
    renderVendorGrid();
    renderLogs();
}

function renderCategoryPills() {
    const categories = ["All", "Venue", "Catering", "Decoration", "MUA & Attire", "Documentation", "Entertainment & WO"];
    const container = document.getElementById("category-pills");
    
    if (!container) return;
    container.innerHTML = "";
    
    categories.forEach(cat => {
        const count = cat === "All" ? appState.vendors.length : appState.vendors.filter(v => v.category === cat).length;
        const isActive = appState.activeCategory === cat;
        
        const btn = document.createElement("button");
        btn.onclick = () => filterCategory(cat);
        btn.id = `pill-${cat.replace(/ & /g, "-")}`;
        btn.className = `w-full text-left px-4 py-2.5 rounded-[11px] text-[14px] font-medium flex items-center justify-between transition-all active-scale ${
            isActive ? "bg-[#0066cc] text-white" : "bg-transparent text-[#1d1d1f] hover:bg-[#f5f5f7]"
        }`;
        
        btn.innerHTML = `
            <span>${cat === "All" ? "Semua Kategori" : cat}</span>
            <span class="text-xs ${isActive ? "bg-white/20" : "bg-[#f5f5f7] text-[#7a7a7a]"} px-2 py-0.5 rounded-[5px] font-semibold">${count}</span>
        `;
        container.appendChild(btn);
    });
}

function renderBudgetCalculations() {
    const limit = appState.budgetLimit;
    const spent = appState.vendors
        .filter(v => v.status === "Selected")
        .reduce((sum, current) => sum + current.price, 0);
    
    const remaining = limit - spent;
    const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

    // Formatting IDR
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    // Sub-nav and Deskop Elements
    const limitDisp = document.getElementById("budget-limit-display");
    const spentDisp = document.getElementById("budget-spent-display");
    const remDisp = document.getElementById("budget-remaining-display");
    const mobSpentDisp = document.getElementById("mobile-spent-display");

    if (limitDisp) limitDisp.innerText = formatIDR(limit);
    if (spentDisp) spentDisp.innerText = formatIDR(spent);
    if (remDisp) remDisp.innerText = formatIDR(remaining);
    if (mobSpentDisp) mobSpentDisp.innerText = formatIDR(spent);

    // Ring Progress Calculation
    const circle = document.getElementById("budget-progress-circle");
    const percentageText = document.getElementById("budget-percentage");
    
    if (percentageText) percentageText.innerText = `${percentage}%`;
    
    if (circle) {
        // stroke-dasharray="251.2" (length of circle circumference with r=40)
        const circumference = 2 * Math.PI * 40;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // Dynamic Progress Color
        if (percentage > 90) {
            circle.setAttribute("stroke", "#ff3b30"); // Alert Red
            document.getElementById("budget-status-alert").className = "bg-rose-50 text-rose-800 border border-rose-200 text-xs px-3 py-2 rounded-[11px] text-center";
            document.getElementById("budget-status-alert").innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Sisa Anggaran Menipis!`;
        } else if (percentage > 70) {
            circle.setAttribute("stroke", "#ff9500"); // Alert Orange
            document.getElementById("budget-status-alert").className = "bg-amber-50 text-amber-800 border border-amber-200 text-xs px-3 py-2 rounded-[11px] text-center";
            document.getElementById("budget-status-alert").innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Mendekati Batas Aman`;
        } else {
            circle.setAttribute("stroke", "#0066cc"); // Primary Action Blue
            document.getElementById("budget-status-alert").className = "bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-2 rounded-[11px] text-center";
            document.getElementById("budget-status-alert").innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Pengeluaran Terkontrol Aman`;
        }
    }
}

function renderVendorGrid() {
    const grid = document.getElementById("vendor-cards-grid");
    const blankState = document.getElementById("blank-state");
    if (!grid || !blankState) return;
    grid.innerHTML = "";

    // Filter vendors list
    let filtered = appState.vendors;
    
    if (appState.activeCategory !== "All") {
        filtered = filtered.filter(v => v.category === appState.activeCategory);
    }
    
    if (appState.activeStatus !== "All") {
        filtered = filtered.filter(v => v.status === appState.activeStatus);
    }

    if (filtered.length === 0) {
        blankState.classList.remove("hidden");
        grid.classList.add("hidden");
        return;
    }

    blankState.classList.add("hidden");
    grid.classList.remove("hidden");

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    filtered.forEach(vendor => {
        let imageUrl = vendor.file_url || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800";
        
        let driveLinkHtml = "";
        if (vendor.drive_url) {
            driveLinkHtml = `
                <a href="${vendor.drive_url}" target="_blank" class="active-scale text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 font-medium flex items-center space-x-1.5 hover:bg-emerald-100 transition mt-2 mb-4 w-fit" title="Buka berkas di Google Drive">
                    <i class="fa-brands fa-google-drive text-emerald-600"></i>
                    <span>Buka Google Drive &rarr;</span>
                </a>
            `;
        }

        const card = document.createElement("div");
        card.className = "bg-white rounded-[18px] border border-[#e0e0e0] overflow-hidden flex flex-col hover:border-[#1d1d1f] transition duration-300 relative";
        
        card.innerHTML = `
            <div class="relative w-full h-[200px] overflow-hidden bg-[#fafafc] p-4 flex items-center justify-center">
                <img src="${imageUrl}" onerror="this.src='https://placehold.co/400x300/f5f5f7/0066cc?text=${vendor.vendor_name}'" alt="${vendor.vendor_name}" class="apple-product-shadow w-[85%] h-[85%] object-cover rounded-[11px] transition-transform duration-500 hover:scale-[1.03]">
                <span class="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(vendor.status)} shadow-sm">
                    ${vendor.status}
                </span>
                <span class="absolute top-4 left-4 bg-black/60 backdrop-blur text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-[5px]">
                    ${vendor.category}
                </span>
            </div>
            
            <div class="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <div class="mb-2">
                        <h4 class="text-xl font-semibold text-[#1d1d1f] leading-snug">${vendor.vendor_name}</h4>
                        <span class="text-xs text-[#7a7a7a] font-medium block mt-0.5">${vendor.package_name}</span>
                    </div>
                    
                    <p class="text-[17px] font-bold text-[#0066cc] mb-2">${formatIDR(vendor.price)}</p>
                    
                    ${driveLinkHtml}
                    
                    <div class="bg-[#f5f5f7] p-3 rounded-[11px] text-xs text-[#1d1d1f] mb-6 border border-[#e0e0e0]">
                        <span class="font-semibold block mb-1 text-[11px] uppercase text-[#7a7a7a] tracking-wider"><i class="fa-solid fa-microchip mr-1"></i> Catatan Teknis (Planner)</span>
                        ${vendor.notes || "Belum ada catatan teknis tertulis untuk vendor ini."}
                    </div>
                </div>
                
                <div class="flex items-center space-x-2 pt-2 border-t border-[#f0f0f0]">
                    <select onchange="updateStatus('${vendor.vendor_id}', this.value)" class="flex-1 bg-[#fafafc] text-[#1d1d1f] border border-[#e0e0e0] rounded-full text-xs px-3 py-2 font-semibold active-scale focus:outline-none">
                        <option value="Draft" ${vendor.status === 'Draft' ? 'selected' : ''}>Set as Draft</option>
                        <option value="Selected" ${vendor.status === 'Selected' ? 'selected' : ''}>Set as Selected</option>
                        <option value="Eliminated" ${vendor.status === 'Eliminated' ? 'selected' : ''}>Set as Eliminated</option>
                    </select>
                    
                    <button onclick="deleteVendor('${vendor.vendor_id}')" class="active-scale w-8 h-8 rounded-full bg-[#f5f5f7] text-rose-600 hover:bg-rose-50 flex items-center justify-center transition border border-[#e0e0e0]" title="Hapus Usulan">
                        <i class="fa-regular fa-trash-can text-xs"></i>
                    </button>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function getStatusStyle(status) {
    switch(status) {
        case "Selected":
            return "bg-[#e2f5ec] text-[#0d9488]";
        case "Eliminated":
            return "bg-[#ffe5e5] text-[#cc0000]";
        default:
            return "bg-[#f5f5f7] text-[#1d1d1f] border border-[#e0e0e0]";
    }
}

function filterCategory(cat) {
    appState.activeCategory = cat;
    renderWorkspace();
}

function filterStatus(status) {
    appState.activeStatus = status;
    
    const statuses = ["All", "Draft", "Selected", "Eliminated"];
    statuses.forEach(s => {
        const btn = document.getElementById(`status-${s.toLowerCase()}`);
        if (btn) {
            if (s === status) {
                btn.className = "px-3.5 py-1.5 rounded-[8px] text-xs font-medium bg-white text-[#1d1d1f] transition-all shadow-sm border border-[#e0e0e0]";
            } else {
                btn.className = "px-3.5 py-1.5 rounded-[8px] text-xs font-medium text-[#7a7a7a] hover:text-[#1d1d1f] transition-all";
            }
        }
    });
    
    renderWorkspace();
}

function updateStatus(vendorId, newStatus) {
    const vendor = appState.vendors.find(v => v.vendor_id === vendorId);
    if (!vendor) return;

    if (newStatus === "Selected" || newStatus === "Eliminated") {
        if (!hasPermission('canVerifyPayment')) {
            showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk menentukan status final vendor!", "error");
            renderWorkspace();
            return;
        }
    }

    const oldStatus = vendor.status;
    vendor.status = newStatus;

    const logEntry = {
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "STATUS_UPDATE",
        detail: `Mengubah status ${vendor.vendor_name} dari ${oldStatus} -> ${newStatus}`
    };
    appState.logs.unshift(logEntry);

    saveProjectData(appState.weddingId);

    if (appState.gasApiUrl) {
        postToGas({
            action: "updateVendorStatus",
            vendor_id: vendorId,
            new_status: newStatus,
            user_email: appState.userEmail
        });
    }

    renderWorkspace();
    showToast(`Status ${vendor.vendor_name} diperbarui!`, "success");
}

function deleteVendor(vendorId) {
    if (!hasPermission('canEditVendor')) {
        showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk menghapus usulan vendor!", "error");
        return;
    }

    const vendorIndex = appState.vendors.findIndex(v => v.vendor_id === vendorId);
    if (vendorIndex === -1) return;

    const vendorName = appState.vendors[vendorIndex].vendor_name;
    appState.vendors.splice(vendorIndex, 1);

    const logEntry = {
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "DELETE_VND",
        detail: `Menghapus usulan vendor: ${vendorName}`
    };
    appState.logs.unshift(logEntry);

    saveProjectData(appState.weddingId);

    if (appState.gasApiUrl) {
        postToGas({
            action: "deleteVendor",
            vendor_id: vendorId,
            user_email: appState.userEmail
        });
    }

    renderWorkspace();
    showToast(`Vendor ${vendorName} telah dihapus.`, "info");
}

function openAddVendorModal() {
    if (!hasPermission('canEditVendor')) {
        showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk mengusulkan vendor baru!", "error");
        return;
    }
    document.getElementById("add-vendor-modal").classList.remove("hidden");
}

function closeAddVendorModal() {
    document.getElementById("add-vendor-modal").classList.add("hidden");
    document.getElementById("add-vendor-form").reset();
}

function handleFormSubmit(e) {
    e.preventDefault();

    if (!hasPermission('canEditVendor')) {
        showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk mengusulkan vendor baru!", "error");
        return;
    }

    const category = document.getElementById("vendor-category").value;
    const name = document.getElementById("vendor-name-input").value;
    const packageName = document.getElementById("vendor-package").value;
    const price = parseFloat(document.getElementById("vendor-price").value);
    const notes = document.getElementById("vendor-notes").value;
    const imageUrlInput = document.getElementById("vendor-image-url").value;
    const driveUrlInput = document.getElementById("vendor-drive-url").value;

    const unsplashCategoriesMap = {
        "Venue": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800",
        "Catering": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
        "Decoration": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800",
        "MUA & Attire": "https://images.unsplash.com/photo-1596751303335-742b504853d7?auto=format&fit=crop&q=80&w=800",
        "Documentation": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800",
        "Entertainment & WO": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800"
    };

    const fallbackUrl = unsplashCategoriesMap[category];
    const finalImageUrl = imageUrlInput || fallbackUrl;

    const newId = "VND-" + Math.floor(100 + Math.random() * 900);

    const newVendor = {
        vendor_id: newId,
        category: category,
        vendor_name: name,
        package_name: packageName,
        price: price,
        notes: notes,
        file_url: finalImageUrl,
        drive_url: driveUrlInput || null,
        status: "Draft"
    };

    appState.vendors.unshift(newVendor);

    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "CREATE_VND",
        detail: `Mengusulkan vendor baru: ${name} (${packageName})`
    });

    saveProjectData(appState.weddingId);

    if (appState.gasApiUrl) {
        postToGas({
            action: "addVendor",
            wedding_id: appState.weddingId,
            category: category,
            vendor_name: name,
            package_name: packageName,
            price: price,
            notes: notes,
            file_url: finalImageUrl,
            user_email: appState.userEmail
        });
    }

    closeAddVendorModal();
    renderWorkspace();
    showToast(`Usulan vendor ${name} sukses ditambahkan!`, "success");
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    
    const bgClass = type === "error" ? "bg-red-50 text-red-800 border-red-200" : type === "info" ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-emerald-50 text-emerald-800 border-emerald-200";
    const iconClass = type === "error" ? "fa-circle-xmark text-red-500" : type === "info" ? "fa-circle-info text-blue-500" : "fa-circle-check text-emerald-500";

    toast.className = `flex items-center space-x-3 px-5 py-3.5 rounded-[11px] border shadow-lg text-xs font-semibold ${bgClass} transform translate-x-12 opacity-0 transition-all duration-300 pointer-events-auto`;
    toast.innerHTML = `
        <i class="fa-solid ${iconClass} text-lg"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("translate-x-12", "opacity-0");
    }, 10);

    setTimeout(() => {
        toast.classList.add("translate-x-12", "opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
