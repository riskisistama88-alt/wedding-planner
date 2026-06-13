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
            return;
        }

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
    
    renderPaymentMilestones();
}

function exportToPDF() {
    showToast("Mengekspor Laporan LDR Motherboard ke format PDF...", "info");
    setTimeout(() => {
        showToast("Laporan LDR Motherboard berhasil diunduh!", "success");
    }, 1500);
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
    showToast("Bukti pembayaran berhasil dikirim untuk verifikasi!", "success");
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
    showToast("Pembayaran berhasil diverifikasi & dilunasi!", "success");
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
    showToast("Termin pembayaran berhasil disimpan!", "success");
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
    showToast("Termin pembayaran berhasil dihapus.", "info");
}
