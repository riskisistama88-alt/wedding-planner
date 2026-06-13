let clockInterval = null;
function startLdrClocks() {
    if (clockInterval) clearInterval(clockInterval);
    
    const clockWib = document.getElementById("clock-wib");
    const clockSgt = document.getElementById("clock-sgt");
    if (!clockWib || !clockSgt) return;

    const updateClocks = () => {
        const now = new Date();
        
        const wibTime = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(now);
        clockWib.innerText = wibTime + " WIB";
        
        const sgtTime = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Singapore',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(now);
        clockSgt.innerText = sgtTime + " SGT";
    };
    
    updateClocks();
    clockInterval = setInterval(updateClocks, 1000);
}

function getNextMeetupDate() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    
    const getThirdSaturday = (y, m) => {
        let d = new Date(y, m, 1);
        let satCount = 0;
        while (satCount < 3) {
            if (d.getDay() === 6) {
                satCount++;
                if (satCount === 3) return d;
            }
            d.setDate(d.getDate() + 1);
        }
        return d;
    };

    let meetup = getThirdSaturday(year, month);
    meetup.setHours(10, 0, 0, 0);

    if (now > meetup) {
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        meetup = getThirdSaturday(year, month);
        meetup.setHours(10, 0, 0, 0);
    }
    return meetup;
}

let countdownInterval = null;
function startMeetupCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const target = getNextMeetupDate();
    const container = document.getElementById("meetup-countdown");
    if (!container) return;

    const updateCountdown = () => {
        const now = new Date();
        const diff = target - now;
        
        if (diff <= 0) {
            container.innerText = "Rapat Pertemuan Hari Ini!";
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        container.innerText = `${days} Hari, ${hours} Jam, ${mins} Menit`;
    };
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 60000);
}

function renderLdrHub() {
    startLdrClocks();
    startMeetupCountdown();
    renderTasks();
    renderGuests();
}

function renderTasks() {
    const container = document.getElementById("task-list-container");
    if (!container) return;
    container.innerHTML = "";

    let filtered = appState.tasks;
    if (appState.activeTaskFilter !== "All") {
        filtered = filtered.filter(t => t.timeline === appState.activeTaskFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-xs text-[#7a7a7a]">Tidak ada tugas di kategori ini.</div>`;
        return;
    }

    filtered.forEach(task => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between p-3.5 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0] text-xs transition-all";
        
        const strikeClass = task.completed ? "line-through text-[#7a7a7a]" : "text-[#1d1d1f] font-semibold";
        const checkboxIcon = task.completed ? "fa-circle-check text-emerald-500" : "fa-circle text-gray-300";
        
        let assigneeBadgeColor = "bg-blue-100 text-blue-700";
        if (task.assignee === "Tama") assigneeBadgeColor = "bg-purple-100 text-purple-700";
        else if (task.assignee === "Aura WO") assigneeBadgeColor = "bg-neutral-100 text-neutral-700";

        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <button onclick="toggleTaskCompletion('${task.id}')" class="active-scale text-base transition-colors hover:text-emerald-500">
                    <i class="fa-regular ${checkboxIcon}"></i>
                </button>
                <div>
                    <span class="${strikeClass} block leading-snug">${task.title}</span>
                    <div class="flex items-center space-x-2 mt-1">
                        <span class="text-[9px] bg-[#e0e0e0] text-[#1d1d1f] px-1.5 py-0.5 rounded-[4px] font-bold uppercase">${task.timeline}</span>
                        <span class="text-[9px] ${assigneeBadgeColor} px-1.5 py-0.5 rounded-[4px] font-bold">${task.assignee}</span>
                    </div>
                </div>
            </div>
            <button onclick="deleteTask('${task.id}')" class="active-scale text-gray-400 hover:text-rose-600 transition p-1">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

function filterTasks(timeline) {
    appState.activeTaskFilter = timeline;
    
    const filters = ["All", "H-9", "H-6", "H-3", "H-1"];
    filters.forEach(f => {
        const btn = document.getElementById(`task-filter-${f.toLowerCase().replace("-", "")}`);
        if (!btn) return;
        if (f === timeline) {
            btn.className = "flex-1 py-1 rounded-[8px] bg-white text-[#1d1d1f] shadow-sm";
        } else {
            btn.className = "flex-1 py-1 rounded-[8px] text-[#7a7a7a]";
        }
    });
    renderTasks();
}

function toggleTaskCompletion(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    saveProjectData(appState.weddingId);
    renderTasks();
    
    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "TASK_UPDATE",
        detail: `Mengubah status tugas "${task.title}" menjadi ${task.completed ? "SELESAI" : "BELUM SELESAI"}`
    });
    renderLogs();
    showToast(`Status tugas diperbarui!`, "success");
}

function openAddTaskModal() {
    document.getElementById("add-task-modal").classList.remove("hidden");
}

function closeAddTaskModal() {
    document.getElementById("add-task-modal").classList.add("hidden");
    document.getElementById("task-title-input").value = "";
}

function handleAddTaskSubmit(e) {
    e.preventDefault();
    const title = document.getElementById("task-title-input").value.trim();
    const timeline = document.getElementById("task-timeline-input").value;
    const assignee = document.getElementById("task-assignee-input").value;
    
    if (!title) return;
    
    const newTask = {
        id: "TSK-" + Math.floor(100 + Math.random() * 900),
        title: title,
        timeline: timeline,
        assignee: assignee,
        completed: false
    };
    
    appState.tasks.push(newTask);
    saveProjectData(appState.weddingId);
    
    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "TASK_ADD",
        detail: `Menambahkan tugas baru: "${title}" (${assignee})`
    });
    
    closeAddTaskModal();
    renderTasks();
    renderLogs();
    showToast("Tugas berhasil ditambahkan!", "success");
}

function deleteTask(taskId) {
    const idx = appState.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    
    const title = appState.tasks[idx].title;
    appState.tasks.splice(idx, 1);
    saveProjectData(appState.weddingId);
    
    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "TASK_DELETE",
        detail: `Menghapus tugas: "${title}"`
    });
    
    renderTasks();
    renderLogs();
    showToast("Tugas berhasil dihapus.", "info");
}

function renderGuests() {
    const container = document.getElementById("guest-table-body");
    if (!container) return;
    container.innerHTML = "";

    let filtered = appState.guests;
    
    if (appState.activeGuestFilter !== "All") {
        filtered = filtered.filter(g => g.party === appState.activeGuestFilter);
    }
    
    if (appState.activeGuestRSVPFilter !== "All") {
        filtered = filtered.filter(g => g.rsvp === appState.activeGuestRSVPFilter);
    }

    const totalPax = appState.guests.reduce((sum, g) => sum + g.pax, 0);
    const attendingPax = appState.guests.filter(g => g.rsvp === "Hadir").reduce((sum, g) => sum + g.pax, 0);
    const absentPax = appState.guests.filter(g => g.rsvp === "Absen").reduce((sum, g) => sum + g.pax, 0);
    const pendingPax = appState.guests.filter(g => g.rsvp === "Pending").reduce((sum, g) => sum + g.pax, 0);

    const totStat = document.getElementById("guest-stat-total");
    const attStat = document.getElementById("guest-stat-attending");
    const absStat = document.getElementById("guest-stat-absent");
    const penStat = document.getElementById("guest-stat-pending");

    if (totStat) totStat.innerText = totalPax;
    if (attStat) attStat.innerText = attendingPax;
    if (absStat) absStat.innerText = absentPax;
    if (penStat) penStat.innerText = pendingPax;

    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-xs text-[#7a7a7a]">Tidak ada tamu undangan yang sesuai filter.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(guest => {
        const rsvpStyle = guest.rsvp === "Hadir" ? "bg-emerald-50 text-emerald-800" 
                        : guest.rsvp === "Absen" ? "bg-rose-50 text-rose-800" 
                        : "bg-amber-50 text-amber-800";
        
        const row = document.createElement("tr");
        row.className = "hover:bg-[#fafafc] transition-colors border-b border-[#e0e0e0]";
        row.innerHTML = `
            <td class="px-4 py-3 font-semibold text-xs text-[#1d1d1f]">${guest.name}</td>
            <td class="px-4 py-3 text-[11px] text-[#7a7a7a]">${guest.party}</td>
            <td class="px-4 py-3 text-[11px] font-bold text-[#1d1d1f]">${guest.pax}</td>
            <td class="px-4 py-3">
                <select onchange="updateGuestRSVP('${guest.id}', this.value)" class="bg-transparent text-[11px] font-semibold rounded-[5px] px-1.5 py-0.5 border border-[#e0e0e0] focus:outline-none ${rsvpStyle}">
                    <option value="Pending" ${guest.rsvp === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Hadir" ${guest.rsvp === 'Hadir' ? 'selected' : ''}>Hadir</option>
                    <option value="Absen" ${guest.rsvp === 'Absen' ? 'selected' : ''}>Absen</option>
                </select>
            </td>
            <td class="px-4 py-3 text-[11px] text-[#1d1d1f]">${guest.table_no || "-"}</td>
            <td class="px-4 py-3 text-right">
                <button onclick="deleteGuest('${guest.id}')" class="active-scale text-gray-400 hover:text-rose-600 transition p-1" title="Hapus Tamu">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        container.appendChild(row);
    });
}

function filterGuests(party) {
    appState.activeGuestFilter = party;
    const parties = ["All", "Indah", "Tama", "Keluarga"];
    parties.forEach(p => {
        const btn = document.getElementById(`guest-filter-${p.toLowerCase()}`);
        if (!btn) return;
        if (p === party) {
            btn.className = "px-2.5 py-1 rounded-[5px] bg-white font-medium shadow-sm";
        } else {
            btn.className = "px-2.5 py-1 rounded-[5px] text-[#7a7a7a]";
        }
    });
    renderGuests();
}

function filterGuestsRSVP(rsvp) {
    appState.activeGuestRSVPFilter = rsvp;
    renderGuests();
}

function updateGuestRSVP(guestId, newRsvp) {
    const guest = appState.guests.find(g => g.id === guestId);
    if (!guest) return;
    
    const oldRsvp = guest.rsvp;
    guest.rsvp = newRsvp;
    saveProjectData(appState.weddingId);
    
    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "GUEST_RSVP",
        detail: `Mengubah RSVP "${guest.name}" dari ${oldRsvp} -> ${newRsvp}`
    });
    
    renderGuests();
    renderLogs();
    showToast(`RSVP ${guest.name} diperbarui!`, "success");
}

function openAddGuestModal() {
    document.getElementById("add-guest-modal").classList.remove("hidden");
}

function closeAddGuestModal() {
    document.getElementById("add-guest-modal").classList.add("hidden");
    document.getElementById("guest-name-input").value = "";
    document.getElementById("guest-pax-input").value = "2";
    document.getElementById("guest-table-input").value = "";
}

function handleAddGuestSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("guest-name-input").value.trim();
    const pax = parseInt(document.getElementById("guest-pax-input").value);
    const party = document.getElementById("guest-party-input").value;
    const table_no = document.getElementById("guest-table-input").value.trim();
    
    if (!name || isNaN(pax)) return;
    
    const newGuest = {
        id: "GST-" + Math.floor(100 + Math.random() * 900),
        name: name,
        pax: pax,
        party: party,
        rsvp: "Pending",
        table_no: table_no || null
    };
    
    appState.guests.push(newGuest);
    saveProjectData(appState.weddingId);
    
    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "GUEST_ADD",
        detail: `Menambahkan undangan baru: "${name}" (${pax} pax, Pihak: ${party})`
    });
    
    closeAddGuestModal();
    renderGuests();
    renderLogs();
    showToast("Tamu berhasil ditambahkan!", "success");
}

function deleteGuest(guestId) {
    const idx = appState.guests.findIndex(g => g.id === guestId);
    if (idx === -1) return;
    
    const name = appState.guests[idx].name;
    appState.guests.splice(idx, 1);
    saveProjectData(appState.weddingId);
    
    appState.logs.unshift({
        tanggal: new Date(),
        user: appState.userEmail,
        aktivitas: "GUEST_DELETE",
        detail: `Menghapus undangan: "${name}"`
    });
    
    renderGuests();
    renderLogs();
    showToast("Tamu berhasil dihapus.", "info");
}
