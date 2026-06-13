function renderMotherboardDashboard() {
    const limit = appState.budgetLimit;
    const selectedVendors = appState.vendors.filter(v => v.status === "Selected");
    const spent = selectedVendors.reduce((sum, v) => sum + v.price, 0);
    const remaining = limit - spent;
    const uniqueCategories = new Set(selectedVendors.map(v => v.category));

    // Formatting IDR
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const mbLimit = document.getElementById("mb-limit");
    const mbSpent = document.getElementById("mb-spent");
    const mbRemaining = document.getElementById("mb-remaining");
    const mbProgress = document.getElementById("mb-progress");

    if (mbLimit) mbLimit.innerText = formatIDR(limit);
    if (mbSpent) mbSpent.innerText = formatIDR(spent);
    if (mbRemaining) mbRemaining.innerText = formatIDR(remaining);
    if (mbProgress) mbProgress.innerText = `${uniqueCategories.size} / 6 Kategori`;

    // Populate table
    const tableBody = document.getElementById("mb-selected-table-body");
    if (tableBody) {
        tableBody.innerHTML = "";

        if (selectedVendors.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-xs text-[#7a7a7a]">Belum ada vendor terpilih. Tentukan pilihan Anda di Workspace.</td>
                </tr>
            `;
        } else {
            selectedVendors.forEach(v => {
                const row = document.createElement("tr");
                row.className = "hover:bg-[#fafafc] transition-colors";
                
                let driveIcon = "";
                if (v.drive_url) {
                    driveIcon = `
                        <a href="${v.drive_url}" target="_blank" class="ml-2 text-emerald-600 hover:text-emerald-800 transition active-scale inline-flex items-center" title="Buka berkas di Google Drive">
                            <i class="fa-brands fa-google-drive text-sm"></i>
                        </a>
                    `;
                }

                row.innerHTML = `
                    <td class="px-6 py-4 font-semibold text-xs text-[#7a7a7a] uppercase">${v.category}</td>
                    <td class="px-6 py-4 font-bold text-sm text-[#1d1d1f] flex items-center">${v.vendor_name} ${driveIcon}</td>
                    <td class="px-6 py-4 text-xs text-[#7a7a7a]">${v.package_name}</td>
                    <td class="px-6 py-4 font-semibold text-sm text-[#0066cc]">${formatIDR(v.price)}</td>
                    <td class="px-6 py-4 text-xs leading-relaxed text-[#1d1d1f]">${v.notes || "-"}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
    
    renderPaymentMilestones();
    renderTimeline();
    renderVenueComparison();
}

function exportToPDF() {
    const element = document.getElementById("motherboard-view");
    if (!element) {
        showToast("Halaman motherboard data tidak ditemukan!", "error");
        return;
    }

    showToast("Mengekspor Laporan LDR Motherboard ke format PDF...", "info");

    // Configure options for html2pdf
    const opt = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     `Laporan_AURA_LDR_Motherboard_${appState.weddingId || 'Export'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Run html2pdf conversion
    html2pdf().set(opt).from(element).save()
        .then(() => {
            showToast("Laporan LDR Motherboard berhasil diunduh!", "success");
        })
        .catch(err => {
            console.error("PDF Export error:", err);
            showToast("Gagal mengekspor laporan ke PDF. Silakan coba lagi.", "error");
        });
}

function updateSyncBadge() {
    const badge = document.getElementById("sync-status-badge");
    if (!badge) return;
    
    if (appState.gasApiUrl) {
        badge.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>GAS Live Connected</span>
        `;
        badge.className = "bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-[9999px] text-[12px] hidden sm:inline-flex items-center space-x-1";
    } else {
        badge.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Simulasi Lokal</span>
        `;
        badge.className = "bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-[9999px] text-[12px] hidden sm:inline-flex items-center space-x-1";
    }
}

function syncDefaultMilestones() {
    const selectedVendors = appState.vendors.filter(v => v.status === "Selected");
    let modified = false;

    selectedVendors.forEach(vendor => {
        const hasMilestones = appState.payments.some(p => p.vendor_id === vendor.vendor_id);
        if (!hasMilestones) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            const dp = {
                id: `PM-DP-${vendor.vendor_id}`,
                vendor_id: vendor.vendor_id,
                vendor_name: vendor.vendor_name,
                type: "DP (30%)",
                amount: Math.round(vendor.price * 0.3),
                due_date: formatDateToYYYYMMDD(nextWeek),
                status: "Belum Dibayar",
                receipt_url: null
            };

            const pelunasan = {
                id: `PM-PL-${vendor.vendor_id}`,
                vendor_id: vendor.vendor_id,
                vendor_name: vendor.vendor_name,
                type: "Pelunasan (70%)",
                amount: Math.round(vendor.price * 0.7),
                due_date: "2027-02-20",
                status: "Belum Dibayar",
                receipt_url: null
            };

            appState.payments.push(dp);
            appState.payments.push(pelunasan);
            modified = true;
        }
    });

    if (modified) {
        saveProjectData(appState.weddingId);
    }
}

function renderPaymentMilestones() {
    syncDefaultMilestones();

    const selectedVendors = appState.vendors.filter(v => v.status === "Selected");
    const selectedVendorIds = selectedVendors.map(v => v.vendor_id);
    const tableBody = document.getElementById("mb-payment-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const activeMilestones = appState.payments.filter(p => selectedVendorIds.includes(p.vendor_id));

    if (activeMilestones.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-xs text-[#7a7a7a]">Belum ada jadwal pembayaran. Tentukan pilihan vendor di Workspace atau klik Tambah Termin.</td>
            </tr>
        `;
        const paidText = document.getElementById("pm-total-paid");
        const unpaidText = document.getElementById("pm-total-unpaid");
        if (paidText) paidText.innerText = "Rp0";
        if (unpaidText) unpaidText.innerText = "Rp0";
        return;
    }

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    
    let totalPaid = 0;
    let totalUnpaid = 0;

    activeMilestones.forEach(pm => {
        const vendor = selectedVendors.find(v => v.vendor_id === pm.vendor_id);
        const vendorName = vendor ? vendor.vendor_name : "Unknown Vendor";

        if (pm.status === "Lunas") totalPaid += pm.amount;
        else totalUnpaid += pm.amount;

        renderMilestoneRow(tableBody, pm, vendorName);
    });

    const paidText = document.getElementById("pm-total-paid");
    const unpaidText = document.getElementById("pm-total-unpaid");
    if (paidText) paidText.innerText = formatIDR(totalPaid);
    if (unpaidText) unpaidText.innerText = formatIDR(totalUnpaid);
}

function renderMilestoneRow(container, pm, vendorName) {
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const row = document.createElement("tr");
    row.className = "hover:bg-[#fafafc] transition-colors border-b border-[#e0e0e0]";

    let statusColorClass = "bg-gray-100 text-gray-800 border-gray-200";
    if (pm.status === "Menunggu Verifikasi") statusColorClass = "bg-amber-50 text-amber-800 border-amber-200";
    else if (pm.status === "Lunas") statusColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";

    let receiptHtml = `<span class="text-gray-400 text-xs">-</span>`;
    if (pm.receipt_url) {
        receiptHtml = `
            <a href="${pm.receipt_url}" target="_blank" class="active-scale text-xs text-emerald-600 hover:underline font-semibold flex items-center space-x-1">
                <i class="fa-brands fa-google-drive"></i>
                <span>Lihat Bukti</span>
            </a>
        `;
    } else if (pm.status !== "Lunas") {
        receiptHtml = `
            <button onclick="openUploadReceiptModal('${pm.id}')" class="active-scale text-xs bg-white border border-[#e0e0e0] text-[#0066cc] rounded-lg px-2.5 py-1 font-semibold hover:bg-[#fafafc] transition">
                <i class="fa-solid fa-cloud-arrow-up mr-1 text-gray-400"></i> Upload
            </button>
        `;
    }

    let verifyBtnHtml = `<span class="text-gray-400 text-xs">-</span>`;
    if (pm.status === "Menunggu Verifikasi") {
        verifyBtnHtml = `
            <button onclick="verifyPayment('${pm.id}')" class="active-scale text-xs bg-emerald-600 text-white rounded-lg px-3 py-1 font-semibold hover:bg-emerald-700 transition">
                <i class="fa-solid fa-circle-check mr-1"></i> Verifikasi
            </button>
        `;
    } else if (pm.status === "Lunas") {
        verifyBtnHtml = `
            <span class="text-emerald-600 text-xs font-bold"><i class="fa-solid fa-circle-check mr-1"></i> Terverifikasi</span>
        `;
    }

    let editDeleteHtml = "";
    if (hasPermission('canEditMilestone')) {
        editDeleteHtml = `
            <button onclick="openEditMilestoneModal('${pm.id}')" class="active-scale text-gray-400 hover:text-[#0066cc] transition p-1 ml-2" title="Edit Termin">
                <i class="fa-solid fa-pen text-xs"></i>
            </button>
            <button onclick="deleteMilestone('${pm.id}')" class="active-scale text-gray-400 hover:text-rose-600 transition p-1 ml-1" title="Hapus Termin">
                <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
        `;
    }

    row.innerHTML = `
        <td class="px-6 py-4 font-bold text-sm text-[#1d1d1f]">${vendorName}</td>
        <td class="px-6 py-4 font-semibold text-xs text-[#7a7a7a] uppercase">${pm.type}</td>
        <td class="px-6 py-4 font-semibold text-sm text-[#1d1d1f]">${formatIDR(pm.amount)}</td>
        <td class="px-6 py-4 text-xs text-[#7a7a7a]">${formatDateForDisplay(pm.due_date)}</td>
        <td class="px-6 py-4">${receiptHtml}</td>
        <td class="px-6 py-4">
            <span class="border px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColorClass}">
                ${pm.status}
            </span>
        </td>
        <td class="px-6 py-4 text-right flex items-center justify-end space-x-2 h-[52px]">
            ${verifyBtnHtml}
            ${editDeleteHtml}
        </td>
    `;
    container.appendChild(row);
}

function openUploadReceiptModal(paymentId) {
    document.getElementById("receipt-payment-id").value = paymentId;
    document.getElementById("upload-receipt-modal").classList.remove("hidden");
}

function closeUploadReceiptModal() {
    document.getElementById("upload-receipt-modal").classList.add("hidden");
    document.getElementById("receipt-url-input").value = "";
}

function handleUploadReceiptSubmit(e) {
    e.preventDefault();
    const paymentId = document.getElementById("receipt-payment-id").value;
    const url = document.getElementById("receipt-url-input").value.trim();

    if (!url) return;

    const pm = appState.payments.find(p => p.id === paymentId);
    if (pm) {
        pm.receipt_url = url;
        pm.status = "Menunggu Verifikasi";
        saveProjectData(appState.weddingId);
        
        appState.logs.unshift({
            tanggal: new Date(),
            user: appState.userEmail,
            aktivitas: "PAYMENT_UPLOAD",
            detail: `Mengunggah bukti bayar untuk termin ${pm.type} ${vendorNameFromId(pm.vendor_id)}`
        });
    }

    closeUploadReceiptModal();
    renderPaymentMilestones();
    renderLogs();
    showToast(`${getActiveRoleLabel()} mengunggah bukti transfer untuk verifikasi.`, "success");
}

function verifyPayment(paymentId) {
    if (!hasPermission('canVerifyPayment')) {
        showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk memverifikasi pembayaran!", "error");
        return;
    }

    const pm = appState.payments.find(p => p.id === paymentId);
    if (pm) {
        pm.status = "Lunas";
        saveProjectData(appState.weddingId);
        
        appState.logs.unshift({
            tanggal: new Date(),
            user: appState.userEmail,
            aktivitas: "PAYMENT_VERIFY",
            detail: `Memverifikasi & menyelesaikan termin pembayaran ${pm.type} ${vendorNameFromId(pm.vendor_id)}`
        });
    }

    renderPaymentMilestones();
    renderLogs();
    showToast(`${getActiveRoleLabel()} memverifikasi & melunasi pembayaran.`, "success");
}

function handleMilestoneTypeChange() {
    const typeSelect = document.getElementById("milestone-type-select").value;
    const customContainer = document.getElementById("milestone-custom-type-container");
    const customInput = document.getElementById("milestone-custom-type-input");
    const pctInput = document.getElementById("milestone-pct-input");
    
    if (typeSelect === "Lainnya") {
        customContainer.classList.remove("hidden");
        customInput.setAttribute("required", "true");
    } else {
        customContainer.classList.add("hidden");
        customInput.removeAttribute("required");
        customInput.value = "";
    }

    if (typeSelect === "DP") {
        pctInput.value = "30";
    } else if (typeSelect === "Pelunasan") {
        pctInput.value = "70";
    } else {
        pctInput.value = "";
    }
    calculateMilestoneAmount();
}

function calculateMilestoneAmount() {
    const vendorId = document.getElementById("milestone-vendor-select").value;
    const pctInput = document.getElementById("milestone-pct-input");
    const pctValue = parseFloat(pctInput.value);
    const amountInput = document.getElementById("milestone-amount-input");

    if (!vendorId) return;

    const vendor = appState.vendors.find(v => v.vendor_id === vendorId);
    if (!vendor) return;

    if (!pctInput.value.trim()) {
        amountInput.value = "";
    } else if (!isNaN(pctValue) && pctValue >= 0 && pctValue <= 100) {
        const calculatedAmount = Math.round((vendor.price * pctValue) / 100);
        amountInput.value = calculatedAmount;
    }
}

function openAddMilestoneModal() {
    if (!hasPermission('canEditMilestone')) {
        showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk mengelola termin pembayaran!", "error");
        return;
    }

    const selectedVendors = appState.vendors.filter(v => v.status === "Selected");
    if (selectedVendors.length === 0) {
        showToast("Belum ada vendor terpilih di Workspace!", "error");
        return;
    }

    const select = document.getElementById("milestone-vendor-select");
    if (select) {
        select.innerHTML = "";
        selectedVendors.forEach(v => {
            select.innerHTML += `<option value="${v.vendor_id}">${v.vendor_name} (${v.category})</option>`;
        });
    }

    document.getElementById("milestone-id-input").value = "";
    document.getElementById("milestone-type-select").value = "DP";
    document.getElementById("milestone-pct-input").value = "30";
    document.getElementById("milestone-custom-type-input").value = "";
    document.getElementById("milestone-custom-type-container").classList.add("hidden");
    document.getElementById("milestone-custom-type-input").removeAttribute("required");

    calculateMilestoneAmount();

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById("milestone-duedate-input").value = formatDateToYYYYMMDD(nextWeek);

    document.getElementById("milestone-modal-title").innerHTML = `<i class="fa-solid fa-file-invoice-dollar text-[#0066cc] mr-2"></i> Tambah Termin Pembayaran`;
    document.getElementById("milestone-modal-desc").innerText = "Tambahkan tahapan pembayaran baru untuk vendor terpilih.";

    document.getElementById("add-milestone-modal").classList.remove("hidden");
}

function openEditMilestoneModal(pmId) {
    if (!hasPermission('canEditMilestone')) {
        showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk mengelola termin pembayaran!", "error");
        return;
    }

    const pm = appState.payments.find(p => p.id === pmId);
    if (!pm) return;

    const selectedVendors = appState.vendors.filter(v => v.status === "Selected");
    const select = document.getElementById("milestone-vendor-select");
    if (select) {
        select.innerHTML = "";
        selectedVendors.forEach(v => {
            const selectedAttr = v.vendor_id === pm.vendor_id ? "selected" : "";
            select.innerHTML += `<option value="${v.vendor_id}" ${selectedAttr}>${v.vendor_name} (${v.category})</option>`;
        });
    }

    document.getElementById("milestone-id-input").value = pm.id;
    document.getElementById("milestone-amount-input").value = pm.amount;
    document.getElementById("milestone-duedate-input").value = parseToYYYYMMDD(pm.due_date);

    let typeVal = "Lainnya";
    let pctVal = "";
    let customTypeVal = pm.type;

    const pctMatch = pm.type.match(/\((\d+)%\)/);
    if (pctMatch) {
        pctVal = pctMatch[1];
        customTypeVal = pm.type.replace(/\s*\(\d+%\)/, "");
    }

    if (customTypeVal === "DP" || customTypeVal === "DP (Uang Muka)") {
        typeVal = "DP";
        customTypeVal = "";
    } else if (customTypeVal === "Pelunasan") {
        typeVal = "Pelunasan";
        customTypeVal = "";
    }

    document.getElementById("milestone-type-select").value = typeVal;
    document.getElementById("milestone-pct-input").value = pctVal;
    document.getElementById("milestone-custom-type-input").value = customTypeVal;

    const customContainer = document.getElementById("milestone-custom-type-container");
    if (typeVal === "Lainnya") {
        customContainer.classList.remove("hidden");
        document.getElementById("milestone-custom-type-input").setAttribute("required", "true");
    } else {
        customContainer.classList.add("hidden");
        document.getElementById("milestone-custom-type-input").removeAttribute("required");
    }

    document.getElementById("milestone-modal-title").innerHTML = `<i class="fa-solid fa-pen text-[#0066cc] mr-2"></i> Ubah Termin Pembayaran`;
    document.getElementById("milestone-modal-desc").innerText = "Sesuaikan rincian tahapan pembayaran vendor.";

    document.getElementById("add-milestone-modal").classList.remove("hidden");
}

function closeAddMilestoneModal() {
    document.getElementById("add-milestone-modal").classList.add("hidden");
}

function handleMilestoneSubmit(e) {
    e.preventDefault();
    const pmId = document.getElementById("milestone-id-input").value;
    const vendorId = document.getElementById("milestone-vendor-select").value;
    const typeSelect = document.getElementById("milestone-type-select").value;
    const pctValue = document.getElementById("milestone-pct-input").value.trim();
    const customType = document.getElementById("milestone-custom-type-input").value.trim();
    const amount = parseFloat(document.getElementById("milestone-amount-input").value);
    const dueDate = document.getElementById("milestone-duedate-input").value.trim();

    if (!vendorId || !dueDate || isNaN(amount)) return;

    let finalType = typeSelect;
    if (typeSelect === "Lainnya") {
        finalType = customType || "Lainnya";
    }
    if (pctValue) {
        finalType += ` (${pctValue}%)`;
    }

    const vendorName = vendorNameFromId(vendorId);

    if (pmId) {
        const pm = appState.payments.find(p => p.id === pmId);
        if (pm) {
            pm.vendor_id = vendorId;
            pm.vendor_name = vendorName;
            pm.type = finalType;
            pm.amount = amount;
            pm.due_date = dueDate;

            appState.logs.unshift({
                tanggal: new Date(),
                user: appState.userEmail,
                aktivitas: "PAYMENT_UPDATE",
                detail: `Mengubah termin pembayaran: ${finalType} untuk ${vendorName}`
            });
        }
    } else {
        const newPm = {
            id: "PM-CST-" + Math.floor(100 + Math.random() * 900),
            vendor_id: vendorId,
            vendor_name: vendorName,
            type: finalType,
            amount: amount,
            due_date: dueDate,
            status: "Belum Dibayar",
            receipt_url: null
        };
        appState.payments.push(newPm);

        appState.logs.unshift({
            tanggal: new Date(),
            user: appState.userEmail,
            aktivitas: "PAYMENT_ADD",
            detail: `Menambahkan termin pembayaran baru: ${finalType} untuk ${vendorName}`
        });
    }

    saveProjectData(appState.weddingId);
    closeAddMilestoneModal();
    renderPaymentMilestones();
    renderLogs();
    showToast(`${getActiveRoleLabel()} menyimpan termin pembayaran.`, "success");
}

function deleteMilestone(pmId) {
    if (!hasPermission('canEditMilestone')) {
        showToast("Akses Ditolak: Anda tidak memiliki wewenang untuk mengelola termin pembayaran!", "error");
        return;
    }

    const idx = appState.payments.findIndex(p => p.id === pmId);
    if (idx === -1) return;

    const pm = appState.payments[idx];
    const type = pm.type;
    const vendorName = vendorNameFromId(pm.vendor_id);

    appState.payments.splice(idx, 1);
    saveProjectData(appState.weddingId);

    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "PAYMENT_DELETE",
        detail: `Menghapus termin pembayaran ${type} untuk ${vendorName}`
    });

    renderPaymentMilestones();
    renderLogs();
    showToast(`${getActiveRoleLabel()} menghapus termin pembayaran.`, "info");
}

// =========================================================================
// DYNAMIC LDR TIMELINE CRUD FUNCTIONS
// =========================================================================

function renderTimeline() {
    const container = document.getElementById("timeline-events-container");
    if (!container) return;
    container.innerHTML = "";

    if (!appState.timeline || appState.timeline.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-xs text-[#7a7a7a]">Belum ada acara dalam timeline. Klik + untuk menambahkan.</div>`;
        return;
    }

    appState.timeline.forEach((item, index) => {
        const idx = index + 1;
        let colorClass = "bg-blue-100 border-blue-500 text-blue-600";
        if (idx % 3 === 2) colorClass = "bg-purple-100 border-purple-500 text-purple-600";
        else if (idx % 3 === 0) colorClass = "bg-emerald-100 border-emerald-500 text-emerald-600";

        const div = document.createElement("div");
        div.className = "relative flex items-start space-x-4 group";
        div.innerHTML = `
            <div class="w-6 h-6 rounded-full ${colorClass} flex items-center justify-center text-xs font-semibold relative z-10">${idx}</div>
            <div class="flex-1 bg-[#f5f5f7] p-4 rounded-[11px] border border-[#e0e0e0] flex items-start justify-between relative">
                <div>
                    <span class="text-xs font-bold text-blue-600 block uppercase tracking-wider">${item.date_label}</span>
                    <h4 class="font-semibold text-sm mt-0.5 text-[#1d1d1f]">${item.title}</h4>
                    <p class="text-xs text-[#7a7a7a] mt-1 leading-relaxed">${item.details}</p>
                </div>
                <div class="flex items-center space-x-1.5 ml-2">
                    <button onclick="openEditTimelineModal('${item.id}')" class="active-scale text-gray-400 hover:text-[#0066cc] transition p-1" title="Edit Acara">
                        <i class="fa-solid fa-pen text-[10px]"></i>
                    </button>
                    <button onclick="deleteTimeline('${item.id}')" class="active-scale text-gray-400 hover:text-rose-600 transition p-1" title="Hapus Acara">
                        <i class="fa-regular fa-trash-can text-[10px]"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function openAddTimelineModal() {
    document.getElementById("timeline-id-input").value = "";
    document.getElementById("timeline-date-input").value = "";
    document.getElementById("timeline-title-input").value = "";
    document.getElementById("timeline-details-input").value = "";
    document.getElementById("timeline-modal-title").innerHTML = `<i class="fa-regular fa-calendar-check text-[#0066cc] mr-2"></i> Tambah Acara Timeline`;
    document.getElementById("timeline-modal").classList.remove("hidden");
}

function openEditTimelineModal(id) {
    const item = appState.timeline.find(t => t.id === id);
    if (!item) return;

    document.getElementById("timeline-id-input").value = item.id;
    document.getElementById("timeline-date-input").value = item.date_label;
    document.getElementById("timeline-title-input").value = item.title;
    document.getElementById("timeline-details-input").value = item.details;
    document.getElementById("timeline-modal-title").innerHTML = `<i class="fa-solid fa-pen text-[#0066cc] mr-2"></i> Edit Acara Timeline`;
    document.getElementById("timeline-modal").classList.remove("hidden");
}

function closeAddTimelineModal() {
    document.getElementById("timeline-modal").classList.add("hidden");
}

function handleTimelineSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("timeline-id-input").value;
    const dateLabel = document.getElementById("timeline-date-input").value.trim();
    const title = document.getElementById("timeline-title-input").value.trim();
    const details = document.getElementById("timeline-details-input").value.trim();

    if (!dateLabel || !title || !details) return;

    if (id) {
        const item = appState.timeline.find(t => t.id === id);
        if (item) {
            item.date_label = dateLabel;
            item.title = title;
            item.details = details;
            showToast(`${getActiveRoleLabel()} memperbarui acara timeline.`, "success");
        }
    } else {
        const newItem = {
            id: "TL-" + Math.floor(100 + Math.random() * 900),
            date_label: dateLabel,
            title: title,
            details: details
        };
        appState.timeline.push(newItem);
        showToast(`${getActiveRoleLabel()} menambahkan acara timeline baru.`, "success");
    }

    saveProjectData(appState.weddingId);
    closeAddTimelineModal();
    renderTimeline();
}

function deleteTimeline(id) {
    if (confirm("Apakah Anda yakin ingin menghapus acara ini dari timeline?")) {
        const index = appState.timeline.findIndex(t => t.id === id);
        if (index === -1) return;
        appState.timeline.splice(index, 1);
        saveProjectData(appState.weddingId);
        renderTimeline();
        showToast(`${getActiveRoleLabel()} menghapus acara timeline.`, "info");
    }
}

// =========================================================================
// DYNAMIC VENUE COMPARISON CRUD FUNCTIONS
// =========================================================================

function renderVenueComparison() {
    const tableContainer = document.getElementById("venue-comp-table-container");
    const reasonContainer = document.getElementById("venue-comp-reason-container");
    if (!tableContainer || !reasonContainer) return;

    const vc = appState.venueComparison;
    if (!vc || !vc.features) {
        tableContainer.innerHTML = `<div class="text-center py-8 text-xs text-[#7a7a7a]">Belum ada data perbandingan venue. Klik tombol edit di atas untuk membuat.</div>`;
        reasonContainer.innerHTML = "";
        return;
    }

    let tableHtml = `
        <div class="overflow-x-auto border border-[#e0e0e0] rounded-[11px]">
            <table class="w-full text-left text-xs text-[#1d1d1f]">
                <thead class="bg-[#f5f5f7] text-[10px] uppercase tracking-wider text-[#7a7a7a] border-b border-[#e0e0e0]">
                    <tr>
                        <th class="px-4 py-3">Fitur</th>
                        <th class="px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">${vc.venue_a || "Venue A (Terpilih)"}</th>
                        <th class="px-4 py-3">${vc.venue_b || "Venue B (Dieliminasi)"}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#e0e0e0]">
    `;

    if (vc.features.length === 0) {
        tableHtml += `
            <tr>
                <td colspan="3" class="px-4 py-6 text-center text-xs text-[#7a7a7a]">Belum ada detail fitur yang dimasukkan.</td>
            </tr>
        `;
    } else {
        vc.features.forEach(feat => {
            const classA = feat.is_highlight_a ? "bg-emerald-50/40 text-emerald-700 font-semibold" : "bg-emerald-50/40";
            const classB = feat.is_highlight_b ? "text-red-600 font-semibold" : "";
            
            tableHtml += `
                <tr>
                    <td class="px-4 py-3 font-semibold">${feat.feature_name}</td>
                    <td class="px-4 py-3 ${classA}">${feat.value_a || "-"}</td>
                    <td class="px-4 py-3 ${classB}">${feat.value_b || "-"}</td>
                </tr>
            `;
        });
    }

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    tableContainer.innerHTML = tableHtml;

    if (vc.elimination_reason) {
        reasonContainer.innerHTML = `
            <div class="bg-blue-50 text-blue-800 border border-blue-100 p-3 rounded-[11px] text-[11px] leading-relaxed">
                <i class="fa-solid fa-circle-check mr-1"></i> <strong>Alasan Eliminasi:</strong> ${vc.elimination_reason}
            </div>
        `;
    } else {
        reasonContainer.innerHTML = "";
    }
}

let tempFeatures = [];

function openEditVenueCompModal() {
    const vc = appState.venueComparison || { venue_a: "", venue_b: "", elimination_reason: "", features: [] };
    
    document.getElementById("vc-venue-a-input").value = vc.venue_a || "";
    document.getElementById("vc-venue-b-input").value = vc.venue_b || "";
    document.getElementById("vc-reason-input").value = vc.elimination_reason || "";

    tempFeatures = vc.features ? JSON.parse(JSON.stringify(vc.features)) : [];
    renderFeaturesListInModal();
    
    document.getElementById("venue-comp-modal").classList.remove("hidden");
}

function closeEditVenueCompModal() {
    document.getElementById("venue-comp-modal").classList.add("hidden");
}

function renderFeaturesListInModal() {
    const container = document.getElementById("vc-features-list-container");
    if (!container) return;
    container.innerHTML = "";

    if (tempFeatures.length === 0) {
        container.innerHTML = `<div class="text-center py-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">Belum ada fitur. Klik "+ Tambah Fitur".</div>`;
        return;
    }

    tempFeatures.forEach((feat, index) => {
        const div = document.createElement("div");
        div.className = "bg-[#f9f9fa] border border-[#e0e0e0] p-3 rounded-lg flex items-center space-x-2.5 text-xs";
        div.innerHTML = `
            <input type="text" placeholder="Fitur (ex: Luas)" value="${feat.feature_name || ''}" oninput="tempFeatures[${index}].feature_name = this.value" class="w-1/4 bg-white border border-[#e0e0e0] rounded-lg px-2 py-1.5 focus:outline-none" required>
            
            <div class="flex-1 flex items-center space-x-1">
                <input type="text" placeholder="Detail Venue A" value="${feat.value_a || ''}" oninput="tempFeatures[${index}].value_a = this.value" class="flex-1 bg-white border border-[#e0e0e0] rounded-lg px-2 py-1.5 focus:outline-none">
                <label class="flex items-center space-x-0.5 cursor-pointer">
                    <input type="checkbox" ${feat.is_highlight_a ? 'checked' : ''} onchange="tempFeatures[${index}].is_highlight_a = this.checked" class="rounded text-[#0066cc] w-3.5 h-3.5">
                    <span class="text-[10px] text-gray-500">Highlight</span>
                </label>
            </div>
            
            <div class="flex-1 flex items-center space-x-1">
                <input type="text" placeholder="Detail Venue B" value="${feat.value_b || ''}" oninput="tempFeatures[${index}].value_b = this.value" class="flex-1 bg-white border border-[#e0e0e0] rounded-lg px-2 py-1.5 focus:outline-none">
                <label class="flex items-center space-x-0.5 cursor-pointer">
                    <input type="checkbox" ${feat.is_highlight_b ? 'checked' : ''} onchange="tempFeatures[${index}].is_highlight_b = this.checked" class="rounded text-red-600 w-3.5 h-3.5">
                    <span class="text-[10px] text-gray-500">Highlight</span>
                </label>
            </div>

            <button type="button" onclick="deleteFeatureRowInModal(${index})" class="active-scale w-7 h-7 rounded-lg bg-white border border-[#e0e0e0] text-rose-600 hover:bg-rose-50 flex items-center justify-center transition">
                <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function addFeatureRowInModal() {
    tempFeatures.push({
        feature_name: "",
        value_a: "",
        value_b: "",
        is_highlight_a: false,
        is_highlight_b: false
    });
    renderFeaturesListInModal();
}

function deleteFeatureRowInModal(index) {
    tempFeatures.splice(index, 1);
    renderFeaturesListInModal();
}

function handleVenueCompSubmit(e) {
    e.preventDefault();
    
    const cleanedFeatures = tempFeatures.filter(f => f.feature_name.trim() !== "");

    appState.venueComparison = {
        venue_a: document.getElementById("vc-venue-a-input").value.trim(),
        venue_b: document.getElementById("vc-venue-b-input").value.trim(),
        elimination_reason: document.getElementById("vc-reason-input").value.trim(),
        features: cleanedFeatures
    };

    saveProjectData(appState.weddingId);
    closeEditVenueCompModal();
    renderVenueComparison();
    showToast(`${getActiveRoleLabel()} menyimpan analisis perbandingan venue.`, "success");
}

function autoGenerateVenueComparison() {
    if (!appState.geminiApiKey) {
        showToast("Gemini API Key belum dikonfigurasi! Buka menu 'Setup GAS & AI' untuk menyimpannya.", "error");
        return;
    }

    const venues = appState.vendors.filter(v => v.category === "Venue");
    if (venues.length < 2) {
        showToast("Gagal menganalisis. Minimal harus ada 2 opsi vendor di kategori Venue pada database!", "error");
        return;
    }

    const btn = document.getElementById("btn-auto-vc");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1"></i> Processing...`;
    }

    // Prepare vendor details
    let venueDetails = "";
    venues.forEach((v, idx) => {
        venueDetails += `Venue ${idx + 1} (${v.status === 'Selected' ? 'Terpilih' : 'Dieliminasi'}):\n- Nama: ${v.vendor_name}\n- Paket: ${v.package_name}\n- Harga: Rp${v.price.toLocaleString('id-ID')}\n- Catatan: ${v.notes || '-'}\n\n`;
    });

    const prompt = `Anda adalah asisten analis venue pernikahan. Tugas Anda adalah membandingkan dua opsi venue berikut ini:
${venueDetails}
Analisis kelebihan, harga, fasilitas, listrik, kapasitas, dan kepraktisan. 
Tentukan mana Venue A (Terpilih/Selected) dan Venue B (Dieliminasi/Eliminated) berdasarkan status di atas. Tulis alasan eliminasi secara ringkas, padat, dan profesional.
Ekstrak perbandingan fitur teknis penting (minimal 4 fitur, seperti Harga Sewa, Listrik, Fasilitas AC, Kapasitas, dll.).

Kembalikan hasil analisis HANYA dalam format JSON mentah valid seperti ini (jangan ada penjelasan lain di luar JSON):
{
  "venue_a": "Nama Venue Terpilih",
  "venue_b": "Nama Venue Dieliminasi",
  "elimination_reason": "Alasan mengapa memilih Venue A dibanding Venue B...",
  "features": [
    {
      "feature_name": "Harga Sewa",
      "value_a": "Detail Harga Venue A",
      "value_b": "Detail Harga Venue B",
      "is_highlight_a": true,
      "is_highlight_b": false
    }
  ]
}`;

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
            let resultText = data.candidates[0].content.parts[0].text.trim();
            
            // Clean markdown blocks if returned by Gemini (e.g. ```json ... ```)
            if (resultText.startsWith("```")) {
                resultText = resultText.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
            }

            try {
                const parsed = JSON.parse(resultText);
                
                document.getElementById("vc-venue-a-input").value = parsed.venue_a || "";
                document.getElementById("vc-venue-b-input").value = parsed.venue_b || "";
                document.getElementById("vc-reason-input").value = parsed.elimination_reason || "";

                tempFeatures = parsed.features || [];
                renderFeaturesListInModal();

                showToast(`${getActiveRoleLabel()} men-generate analisis komparasi venue otomatis via Gemini AI.`, "success");
            } catch (jsonErr) {
                console.error("JSON parsing error:", jsonErr, resultText);
                showToast("Format respons AI tidak valid. Coba lagi.", "error");
            }
        } else {
            showToast("Respons API tidak valid. Periksa kuota/status API Key Anda.", "error");
        }
    })
    .catch(err => {
        console.error("API error:", err);
        showToast("Gagal memanggil Gemini API. Coba lagi.", "error");
    })
    .finally(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Generate</span>`;
        }
    });
}
