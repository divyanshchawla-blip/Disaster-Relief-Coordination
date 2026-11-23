/* ==========================================================================
   Disaster Relief Coordination Platform - script.js
   Used by: requests.html, resources.html, volunteers.html
   Each page only runs its own part (it looks for its own table on the page).
   Data is kept in the browser (localStorage), so changes stay after refresh.
   ========================================================================== */


/* ---------------------------------------------------------------
   1. SAMPLE DATA (first-time data, matches your dashboard numbers)
   --------------------------------------------------------------- */
var SEED_REQUESTS = [
    { id: 1, name: "Harpreet Kaur", type: "Wildfire",   need: "Rescue",      location: "Ludhiana",   people: 6,  urgency: "Low",    status: "Resolved" },
    { id: 2, name: "Manoj Verma",   type: "Earthquake", need: "Medical aid", location: "Kapurthala", people: 12, urgency: "High",   status: "Pending" },
    { id: 3, name: "Sukhdev Singh", type: "Flood",      need: "Food",        location: "Jalandhar",  people: 20, urgency: "Medium", status: "Pending" },
    { id: 4, name: "Anita Devi",    type: "Flood",      need: "Shelter",     location: "Phagwara",   people: 35, urgency: "High",   status: "In Progress" }
];

var SEED_RESOURCES = [
    { id: 1, item: "Food packets",     category: "Food",    qty: 320, location: "Ludhiana Depot" },
    { id: 2, item: "Drinking water",   category: "Water",   qty: 450, location: "Jalandhar Depot" },
    { id: 3, item: "Blankets",         category: "Shelter", qty: 180, location: "Phagwara Depot" },
    { id: 4, item: "Tents",            category: "Shelter", qty: 40,  location: "Kapurthala Depot" },
    { id: 5, item: "First-aid kits",   category: "Medical", qty: 25,  location: "Ludhiana Depot" },
    { id: 6, item: "Rescue boats",     category: "Rescue",  qty: 0,   location: "Jalandhar Depot" }
];

var SEED_VOLUNTEERS = [
    { id: 1, name: "Aman Sharma", phone: "9876543210", skill: "Medical aid", area: "Phagwara", status: "Available" },
    { id: 2, name: "Simran Kaur", phone: "9812345678", skill: "Rescue",      area: "Ludhiana", status: "Assigned" }
];

var LOW_STOCK_LIMIT = 50;      // below this quantity an item shows as "Low stock"


/* ---------------------------------------------------------------
   2. SMALL HELPER FUNCTIONS
   --------------------------------------------------------------- */
var memoryStore = {};          // backup if the browser blocks localStorage

function $(id) {
    return document.getElementById(id);
}

function loadData(key, seed) {
    try {
        var raw = localStorage.getItem(key);
        if (raw) { return JSON.parse(raw); }
    } catch (e) { }
    if (memoryStore[key]) { return memoryStore[key]; }
    return JSON.parse(JSON.stringify(seed));
}

function saveData(key, data) {
    memoryStore[key] = data;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { }
}

function clearNode(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
}

function nextId(list) {
    var max = 0;
    list.forEach(function (item) { if (item.id > max) { max = item.id; } });
    return max + 1;
}

function addCell(row, text, className) {
    var td = document.createElement("td");
    td.textContent = text;
    if (className) { td.className = className; }
    row.appendChild(td);
    return td;
}

function makeButton(label, className, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.className = className;
    b.addEventListener("click", onClick);
    return b;
}

function addActionCell(row, buttons) {
    var td = document.createElement("td");
    td.className = "ai-actions";
    buttons.forEach(function (b) { td.appendChild(b); });
    row.appendChild(td);
}

function showMessage(box, text, isOk) {
    box.textContent = text;
    box.className = "ai-msg " + (isOk ? "ok" : "bad");
}

function hideMessage(box) {
    box.textContent = "";
    box.className = "ai-msg";
}

function onEnter(ids, handler) {
    ids.forEach(function (id) {
        $(id).addEventListener("keydown", function (e) {
            if (e.key === "Enter") { handler(); }
        });
    });
}


/* ---------------------------------------------------------------
   3. ALL REQUESTS PAGE  (requests.html)
   --------------------------------------------------------------- */
function nextStatus(status) {
    if (status === "Pending") { return "In Progress"; }
    if (status === "In Progress") { return "Resolved"; }
    return "Pending";
}

function statusButtonLabel(status) {
    if (status === "Pending") { return "Start work"; }
    if (status === "In Progress") { return "Mark resolved"; }
    return "Reopen";
}

function initRequests() {
    var requests = loadData("drc_requests", SEED_REQUESTS);
    var body = $("requestsBody");

    function render() {
        var q = $("searchBox").value.trim().toLowerCase();
        var urgency = $("urgencyFilter").value;
        var status = $("statusFilter").value;
        var shown = 0;

        clearNode(body);

        requests.forEach(function (r) {
            var text = (r.name + " " + r.type + " " + r.need + " " + r.location).toLowerCase();
            if (q && text.indexOf(q) === -1) { return; }
            if (urgency && r.urgency !== urgency) { return; }
            if (status && r.status !== status) { return; }

            shown++;
            var row = document.createElement("tr");
            addCell(row, r.id);
            addCell(row, r.name);
            addCell(row, r.type);
            addCell(row, r.need);
            addCell(row, r.location);
            addCell(row, r.people);
            addCell(row, r.urgency, "urg-" + r.urgency.toLowerCase());
            addCell(row, r.status);
            addActionCell(row, [
                makeButton(statusButtonLabel(r.status), "ai-btn-small", function () {
                    r.status = nextStatus(r.status);
                    saveData("drc_requests", requests);
                    render();
                })
            ]);
            body.appendChild(row);
        });

        $("countText").textContent = "Showing " + shown + " of " + requests.length + " requests";
        $("emptyText").style.display = (shown === 0) ? "block" : "none";
    }

    $("searchBox").addEventListener("input", render);
    $("urgencyFilter").addEventListener("change", render);
    $("statusFilter").addEventListener("change", render);
    $("clearBtn").addEventListener("click", function () {
        $("searchBox").value = "";
        $("urgencyFilter").value = "";
        $("statusFilter").value = "";
        render();
    });

    render();
}


/* ---------------------------------------------------------------
   4. RESOURCES PAGE  (resources.html)
   --------------------------------------------------------------- */
function stockLevel(qty) {
    if (qty <= 0) { return { label: "Out of stock", cls: "urg-high" }; }
    if (qty < LOW_STOCK_LIMIT) { return { label: "Low stock", cls: "urg-medium" }; }
    return { label: "Available", cls: "urg-low" };
}

function initResources() {
    var resources = loadData("drc_resources", SEED_RESOURCES);
    var body = $("resourcesBody");
    var msg = $("resMsg");

    function updateStats() {
        var avail = 0, low = 0, out = 0;
        resources.forEach(function (r) {
            var level = stockLevel(r.qty).label;
            if (level === "Available") { avail++; }
            else if (level === "Low stock") { low++; }
            else { out++; }
        });
        $("statTotal").textContent = resources.length;
        $("statAvail").textContent = avail;
        $("statLow").textContent = low;
        $("statOut").textContent = out;
    }

    function changeQty(item, amount) {
        item.qty = Math.max(0, item.qty + amount);
        saveData("drc_resources", resources);
        render();
    }

    function removeItem(item) {
        if (!confirm("Remove " + item.item + " from the list?")) { return; }
        resources = resources.filter(function (r) { return r.id !== item.id; });
        saveData("drc_resources", resources);
        render();
    }

    function render() {
        var q = $("resSearch").value.trim().toLowerCase();
        var category = $("resFilter").value;
        var shown = 0;

        clearNode(body);

        resources.forEach(function (r) {
            var text = (r.item + " " + r.category + " " + r.location).toLowerCase();
            if (q && text.indexOf(q) === -1) { return; }
            if (category && r.category !== category) { return; }

            shown++;
            var level = stockLevel(r.qty);
            var row = document.createElement("tr");
            addCell(row, r.id);
            addCell(row, r.item);
            addCell(row, r.category);
            addCell(row, r.qty);
            addCell(row, r.location);
            addCell(row, level.label, level.cls);
            addActionCell(row, [
                makeButton("+10", "ai-btn-small", function () { changeQty(r, 10); }),
                makeButton("-10", "ai-btn-small", function () { changeQty(r, -10); }),
                makeButton("Remove", "ai-btn-small ai-btn-danger", function () { removeItem(r); })
            ]);
            body.appendChild(row);
        });

        $("resCount").textContent = "Showing " + shown + " of " + resources.length + " items";
        $("resEmpty").style.display = (shown === 0) ? "block" : "none";
        updateStats();
    }

    function addResource() {
        var name = $("resName").value.trim();
        var category = $("resCategory").value;
        var qtyText = $("resQty").value.trim();
        var location = $("resLocation").value.trim();
        var qty = Number(qtyText);

        if (name.length < 2) { showMessage(msg, "Please enter the item name (at least 2 characters).", false); return; }
        if (category === "") { showMessage(msg, "Please select a category.", false); return; }
        if (qtyText === "" || !Number.isInteger(qty) || qty < 0) { showMessage(msg, "Quantity must be a whole number (0 or more).", false); return; }
        if (location.length < 2) { showMessage(msg, "Please enter where the item is stored.", false); return; }

        resources.push({ id: nextId(resources), item: name, category: category, qty: qty, location: location });
        saveData("drc_resources", resources);

        $("resName").value = "";
        $("resCategory").value = "";
        $("resQty").value = "";
        $("resLocation").value = "";
        showMessage(msg, name + " was added to the resources list.", true);
        render();
    }

    $("resSearch").addEventListener("input", render);
    $("resFilter").addEventListener("change", render);
    $("resClear").addEventListener("click", function () {
        $("resSearch").value = "";
        $("resFilter").value = "";
        render();
    });
    $("addResBtn").addEventListener("click", addResource);
    onEnter(["resName", "resQty", "resLocation"], addResource);

    hideMessage(msg);
    render();
}


/* ---------------------------------------------------------------
   5. VOLUNTEERS PAGE  (volunteers.html)
   --------------------------------------------------------------- */
function initVolunteers() {
    var volunteers = loadData("drc_volunteers", SEED_VOLUNTEERS);
    var body = $("volunteersBody");
    var msg = $("volMsg");

    function updateStats() {
        var free = 0;
        volunteers.forEach(function (v) { if (v.status === "Available") { free++; } });
        $("statVolTotal").textContent = volunteers.length;
        $("statVolFree").textContent = free;
        $("statVolBusy").textContent = volunteers.length - free;
    }

    function toggleStatus(v) {
        v.status = (v.status === "Available") ? "Assigned" : "Available";
        saveData("drc_volunteers", volunteers);
        render();
    }

    function removeVolunteer(v) {
        if (!confirm("Remove " + v.name + " from the volunteers list?")) { return; }
        volunteers = volunteers.filter(function (x) { return x.id !== v.id; });
        saveData("drc_volunteers", volunteers);
        render();
    }

    function render() {
        var q = $("volSearch").value.trim().toLowerCase();
        var status = $("volFilter").value;
        var shown = 0;

        clearNode(body);

        volunteers.forEach(function (v) {
            var text = (v.name + " " + v.phone + " " + v.skill + " " + v.area).toLowerCase();
            if (q && text.indexOf(q) === -1) { return; }
            if (status && v.status !== status) { return; }

            shown++;
            var row = document.createElement("tr");
            addCell(row, v.id);
            addCell(row, v.name);
            addCell(row, v.phone);
            addCell(row, v.skill);
            addCell(row, v.area);
            addCell(row, v.status, v.status === "Available" ? "urg-low" : "vol-busy");
            addActionCell(row, [
                makeButton(v.status === "Available" ? "Assign" : "Make available", "ai-btn-small", function () { toggleStatus(v); }),
                makeButton("Remove", "ai-btn-small ai-btn-danger", function () { removeVolunteer(v); })
            ]);
            body.appendChild(row);
        });

        $("volCount").textContent = "Showing " + shown + " of " + volunteers.length + " volunteers";
        $("volEmpty").style.display = (shown === 0) ? "block" : "none";
        updateStats();
    }

    function addVolunteer() {
        var name = $("volName").value.trim();
        var phone = $("volPhone").value.trim();
        var skill = $("volSkill").value;
        var area = $("volArea").value.trim();

        if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(name)) { showMessage(msg, "Please enter a valid name (letters only, at least 2 characters).", false); return; }
        if (!/^[0-9]{10}$/.test(phone)) { showMessage(msg, "Phone number must be exactly 10 digits.", false); return; }
        if (skill === "") { showMessage(msg, "Please select a skill.", false); return; }
        if (area.length < 2) { showMessage(msg, "Please enter the area / city.", false); return; }

        var duplicate = volunteers.some(function (v) { return v.phone === phone; });
        if (duplicate) { showMessage(msg, "A volunteer with this phone number is already registered.", false); return; }

        volunteers.push({ id: nextId(volunteers), name: name, phone: phone, skill: skill, area: area, status: "Available" });
        saveData("drc_volunteers", volunteers);

        $("volName").value = "";
        $("volPhone").value = "";
        $("volSkill").value = "";
        $("volArea").value = "";
        showMessage(msg, name + " was registered as a volunteer.", true);
        render();
    }

    $("volSearch").addEventListener("input", render);
    $("volFilter").addEventListener("change", render);
    $("volClear").addEventListener("click", function () {
        $("volSearch").value = "";
        $("volFilter").value = "";
        render();
    });
    $("addVolBtn").addEventListener("click", addVolunteer);
    onEnter(["volName", "volPhone", "volArea"], addVolunteer);

    hideMessage(msg);
    render();
}


/* ---------------------------------------------------------------
   6. START: run only the part that belongs to the current page
   --------------------------------------------------------------- */ 
document.addEventListener("DOMContentLoaded", function () {
    if ($("requestsBody")) { initRequests(); }
    if ($("resourcesBody")) { initResources(); }
    if ($("volunteersBody")) { initVolunteers(); }
});

