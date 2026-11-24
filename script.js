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



/* ==========================================================================
   ===== CODE ADDED BY AI (round 2)  -  everything above is unchanged =====
   ===== Used by: index.html (dashboard), emergency.html (form),      =====
   =====          answer.html ("request received" page)                =====
   ===== It reads/writes the SAME localStorage keys as the code above, =====
   ===== so a request sent from the form shows up on the dashboard and  =====
   ===== on the All Requests page straight away.                        =====
   ========================================================================== */


/* ---------------------------------------------------------------
   7. SMALL HELPERS FOR THE NEW PAGES
   --------------------------------------------------------------- */
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function readQuery(name) {
    var parts = window.location.search.replace("?", "").split("&");
    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split("=");
        if (pair[0] === name) {
            try { return decodeURIComponent((pair[1] || "").replace(/\+/g, " ")); }
            catch (e) { return pair[1] || ""; }
        }
    }
    return "";
}

// small floating message (does not move anything on the page)
function toast(text, isOk) {
    var box = $("aiToast");
    if (!box) {
        box = document.createElement("p");
        box.id = "aiToast";
        document.body.appendChild(box);
    }
    box.textContent = text;
    box.className = "ai-msg ai-toast " + (isOk ? "ok" : "bad");
    clearTimeout(toast.timer);
    if (!isOk) {
        toast.timer = setTimeout(function () { box.className = "ai-msg ai-toast"; }, 4500);
    }
}


/* ---------------------------------------------------------------
   8. DASHBOARD PAGE  (index.html)
   Fills the 6 number cards, the progress bar and "Latest 5 requests"
   from the saved data. Layout / HTML stays exactly as you made it.
   --------------------------------------------------------------- */
function urgencyColor(urgency) {
    if (urgency === "High") { return "red"; }
    if (urgency === "Medium") { return "orangered"; }
    return "green";
}

function initDashboard() {
    var numbers = document.querySelectorAll("#mid .bw h1");
    var progressText = document.querySelector("#below_mid h4");
    var slider = document.querySelector("#below_mid input[type=range]");
    var sliderForm = document.querySelector("#below_mid form");
    var list = document.getElementById("end_in");
    var percent = 0;

    function count(requests, field, value) {
        var n = 0;
        requests.forEach(function (r) { if (r[field] === value) { n++; } });
        return n;
    }

    function render() {
        var requests = loadData("drc_requests", SEED_REQUESTS);
        var volunteers = loadData("drc_volunteers", SEED_VOLUNTEERS);
        var resolved = count(requests, "status", "Resolved");

        // 6 cards, same order as in index.html
        numbers[0].textContent = requests.length;
        numbers[1].textContent = count(requests, "status", "Pending");
        numbers[2].textContent = count(requests, "status", "In Progress");
        numbers[3].textContent = resolved;
        numbers[4].textContent = count(requests, "urgency", "High");
        numbers[5].textContent = volunteers.length;

        // overall progress
        percent = requests.length ? Math.round((resolved / requests.length) * 100) : 0;
        progressText.textContent = percent + "% of requests resolved";
        slider.value = percent;

        // latest 5 requests (newest first); the first ".ends" row is the table heading
        var rows = list.querySelectorAll(".ends");
        for (var i = 1; i < rows.length; i++) { list.removeChild(rows[i]); }

        var latest = requests.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 5);

        if (latest.length === 0) {
            var empty = document.createElement("div");
            empty.className = "ends";
            empty.textContent = "No requests yet";
            list.appendChild(empty);
        }

        latest.forEach(function (r) {
            var row = document.createElement("div");
            row.className = "ends";
            [r.id, r.type, r.location, r.urgency, r.status].forEach(function (value, index) {
                var cell = document.createElement("div");
                cell.className = "1";
                cell.textContent = value;
                if (index === 3) { cell.style.color = urgencyColor(r.urgency); }
                row.appendChild(cell);
            });
            row.addEventListener("click", function () { window.location.href = "requests.html"; });
            list.appendChild(row);
        });
    }

    // the progress bar only shows the value, it is not meant to be dragged
    slider.addEventListener("input", function () { slider.value = percent; });
    sliderForm.addEventListener("submit", function (e) { e.preventDefault(); });

    // refresh when coming back with the browser Back button or when another tab changes data
    window.addEventListener("pageshow", render);
    window.addEventListener("storage", render);

    render();
}


/* ---------------------------------------------------------------
   9. REPORT EMERGENCY FORM  (emergency.html)
   Checks every field, saves the request, then opens answer.html
   --------------------------------------------------------------- */
function selectedText(select) {
    // your <option> tags have empty values, so we read the visible text instead
    if (select.selectedIndex <= 0) { return ""; }
    return select.options[select.selectedIndex].text.replace(/^\s+|\s+$/g, "");
}

function initEmergencyForm() {
    var form = document.querySelector("#mid2 form");
    var submitBtn = $("f1");

    var nameBox = $("name");
    var phoneBox = $("phone");
    var peopleBox = $("effected");
    var typeBox = $("disaster");
    var helpBox = $("help");
    var urgencyBox = $("urgency");
    var areaBox = $("area");
    var descBox = $("description");
    var allFields = [nameBox, phoneBox, peopleBox, typeBox, helpBox, urgencyBox, areaBox, descBox];

    form.noValidate = true;     // we show our own messages instead of the browser's pop-ups

    function fail(field, text) {
        field.className = (field.className ? field.className + " " : "") + "ai-invalid";
        field.focus();
        toast(text, false);
    }

    function clearMarks() {
        allFields.forEach(function (f) {
            f.className = f.className.replace(/\s*ai-invalid/g, "");
        });
    }

    allFields.forEach(function (f) {
        f.addEventListener("input", function () { f.className = f.className.replace(/\s*ai-invalid/g, ""); });
        f.addEventListener("change", function () { f.className = f.className.replace(/\s*ai-invalid/g, ""); });
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearMarks();

        var name = nameBox.value.replace(/^\s+|\s+$/g, "");
        var phone = phoneBox.value.replace(/^\s+|\s+$/g, "");
        var people = Number(peopleBox.value);
        var type = selectedText(typeBox);
        var need = selectedText(helpBox);
        var urgency = selectedText(urgencyBox);
        var area = areaBox.value.replace(/^\s+|\s+$/g, "");
        var description = descBox.value.replace(/^\s+|\s+$/g, "");

        if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(name)) { fail(nameBox, "Please enter your name (letters only, at least 2 characters)."); return; }
        if (!/^[0-9]{10}$/.test(phone)) { fail(phoneBox, "Phone number must be exactly 10 digits."); return; }
        if (peopleBox.value === "" || !isFinite(people) || Math.floor(people) !== people || people < 1) { fail(peopleBox, "People effected must be a whole number (1 or more)."); return; }
        if (type === "") { fail(typeBox, "Please select the disaster type."); return; }
        if (need === "") { fail(helpBox, "Please select the help needed."); return; }
        if (urgency === "") { fail(urgencyBox, "Please select the urgency."); return; }
        if (area.length < 2) { fail(areaBox, "Please enter the location (area / city)."); return; }
        if (description.length < 10) { fail(descBox, "Description must be at least 10 characters."); return; }

        // save into the same list the Dashboard and All Requests pages read
        var requests = loadData("drc_requests", SEED_REQUESTS);
        var record = {
            id: nextId(requests),
            name: name,
            type: capitalize(type),
            need: need,
            location: area,
            people: people,
            urgency: urgency,
            status: "Pending",
            phone: phone,
            description: description
        };
        requests.push(record);
        saveData("drc_requests", requests);

        submitBtn.disabled = true;      // stops double submit
        toast("Request #" + record.id + " submitted successfully. Opening your response page...", true);

        setTimeout(function () {
            window.location.href = "answer.html?id=" + record.id +
                "&type=" + encodeURIComponent(record.type) +
                "&loc=" + encodeURIComponent(record.location);
        }, 900);
    });
}


/* ---------------------------------------------------------------
   10. "HELP IS ON THE WAY" PAGE  (answer.html)
   Shows the request number, the location and safety steps for the
   disaster type that was submitted. If the page is opened directly
   (no request), your original text is left as it is.
   --------------------------------------------------------------- */
var SAFETY_STEPS = {
    earthquake: [
        "Drop, Cover, and Hold On: Drop to your hands and knees, take cover under a sturdy desk or table, and hold on until the shaking stops.",
        "Stay Away from Glass and Heavy Objects: Move away from windows, mirrors, bookshelves, and light fixtures that could shatter or fall.",
        "Stay Indoors Until Shaking Stops: Do not run outside during the shaking, as falling debris near building exits poses a high risk.",
        "Move to an Open Area if Outdoors: If you are already outside, move to a clear spot away from buildings, trees, streetlights, and utility wires.",
        "Expect Aftershocks: Be ready to drop, cover, and hold on again when secondary tremors occur after the main quake."
    ],
    flood: [
        "Move to Higher Ground: Go to the highest safe floor or area right away. Do not wait for the water to rise.",
        "Avoid Floodwater: Never walk, swim, or drive through moving or standing water. It can hide hazards and sweep you away.",
        "Switch Off Power and Gas: If it is safe to do so, turn off electricity and gas at the main switches and stay away from electrical equipment.",
        "Keep Essentials Ready: Keep drinking water, medicines, a torch, a charged phone, and important documents together in one bag.",
        "Stay Away from Rivers and Bridges: Keep clear of riverbanks, drains, and damaged roads, and follow any evacuation order."
    ],
    wildfire: [
        "Evacuate Early: If you are told to leave, go immediately by the marked route and do not return until officials say it is safe.",
        "Protect Your Breathing: Cover your nose and mouth with a damp cloth or mask and wear long sleeves to cover your skin.",
        "Close Doors and Windows: If you cannot leave, shut all doors, windows, and vents and stay in a room away from the side facing the fire.",
        "Stay Low Away from Smoke: Smoke rises, so stay low where the air is cleaner and move away from heavy smoke.",
        "Keep Roads Clear: Do not block roads that fire and rescue vehicles need to reach your area."
    ],
    pandemic: [
        "Isolate if You Feel Unwell: Stay in a separate room and avoid contact with other people as much as possible.",
        "Wear a Mask: Cover your nose and mouth when you are around others or when you must go out.",
        "Wash Your Hands Often: Use soap and water for at least 20 seconds, or a sanitizer if soap is not available.",
        "Keep Your Distance: Stay about one metre away from others and avoid crowded places.",
        "Seek Medical Help: If you have trouble breathing, chest pain, or a high fever, tell the response team immediately."
    ],
    other: [
        "Stay Calm and Move to a Safe Place: Go to the nearest safe and open area away from any danger.",
        "Keep Your Phone Charged and Nearby: The response team may call you on the number you gave.",
        "Follow Official Instructions: Listen to announcements from local authorities and emergency workers.",
        "Help Others Only if It Is Safe: Do not put yourself in danger. Tell the response team if someone needs help.",
        "Keep Essentials Together: Keep water, medicines, a torch, and important documents ready in one bag."
    ]
};

function initAnswerPage() {
    var reply = $("reply");
    var id = readQuery("id");
    var type = readQuery("type");
    var place = readQuery("loc");

    if (id === "" && type === "") { return; }       // opened directly: keep the original text

    var intro = reply.getElementsByTagName("p")[0];
    var stepsBox = reply.getElementsByTagName("div")[0].getElementsByTagName("p")[0];

    var text = "Your request" + (id ? " #" + id : "") + " has been received. A disaster response team has been assigned to your location" +
        (place ? " (" + place + ")" : "") + ". Please remain in a safe and accessible place and follow emergency instructions.";
    intro.textContent = text;

    var steps = SAFETY_STEPS[type.toLowerCase()] || SAFETY_STEPS.other;
    clearNode(stepsBox);
    steps.forEach(function (step, i) {
        if (i > 0) { stepsBox.appendChild(document.createElement("br")); }
        stepsBox.appendChild(document.createTextNode((i + 1) + ". " + step));
    });

    var back = document.createElement("a");
    back.className = "ai-back";
    back.href = "index.html";
    back.textContent = "Back to Dashboard";
    reply.appendChild(back);
}


/* ---------------------------------------------------------------
   11. START (new pages only - section 6 above still runs the old ones)
   --------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector("#mid .bw")) { initDashboard(); }
    if (document.querySelector("#mid2 form")) { initEmergencyForm(); }
    if ($("reply")) { initAnswerPage(); }
});
