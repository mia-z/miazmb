$(document).ready(() => {
    createDb(count);
    $("#debug-box-toggle").on("click", (evt) => {
        if ($("#debug-box-controls").is(":hidden")) {
            $("#debug-box-controls").show();
        } else $("#debug-box-controls").hide();
    });
    $("#debug-box-controls").hide();
});

const baseString = "https://xivapi.com"
const key = "?private_key=a92ca6ab9eab4f259ada7d70beb4bd2b6e545c1969fe4314bdf40f1dabd46b9e";

var createDbTime = 0;
var count = 0;
var itemDb;
var dataCentersAndServers = [];
var prefs = [];
var serverPicked = true;

var allGraph = true;
var nqGraph = false;
var hqGraph = false;

var omittedCount = 0;

var searchBlocker;

var priceChart;

var timer = setInterval(() => {
    createDbTime++;
}, 1);

fetch(baseString+"/servers/dc")
    .then(res => res.json())
    .then(res => {
        dataCentersAndServers = res;
    });

async function createDb(count) {
    $.getJSON("db.json", result => {
        itemDb = result;
        console.log(itemDb);
        clearTimeout(timer);
        $("#debug-box-controls").append("<p> DB loaded in in " + createDbTime + "ms" + "</p>");
        $("#debug-box-controls").append("<p id='debug-server'>" + "Using server: " + Cookies.get("homeServer") + "</p>");
        $("#debug-box-controls").append("<a href='#' id='debug-remove-server-cookie'>" + "Click to clear server cookie"+ "</a>");
        $("#debug-remove-server-cookie").on("click", (evt) => {
            Cookies.remove("homeServer");
            $("#debug-server").html("Using server: " + Cookies.get("homeServer"));
        });
        $("#debug-box-controls").append("<p><a href='#' id='debug-select-server-cookie'>" + "Click to select a server"+ "</a></p>");
        $("#debug-select-server-cookie").on("click", (evt) => {
            firstTimeModal();
        });
        $("#change-server-link").on("click", (evt) => {
            Cookies.remove("homeServer");
            firstTimeModal();
        });
        firstTimeModal();
    });

$("#item-search").on("input", function(evt) {
    clearTimeout(searchBlocker);
    if ($(this).val() == "") {
        $("#search-results").empty();
        return;
    }
    searchBlocker = setTimeout(() => {
        createResults($("#item-search").val().toLowerCase());
    }, 500);
});

async function createResults(query) {
    var results = itemDb.filter(n => n.Name.toLowerCase().includes(query));
    console.log(results);
    $("#search-results").empty();
    console.log(results.length);
    let max = results.length > 20 ? 50 : results.length;
    for (let c = 0; c < max; c++) {
        createCard(Cookies.get("homeServer"), results[c]);
    }
    console.log(omittedCount);
    omittedCount = 0;
}

async function createCard(server, item) {
    await fetch(baseString+"/market/" + server + "/item/" + item.ID + key)
        .then(data => data.json())
        .then((data) => {
            console.log(data);
            if (data["History"].length < 1) {
                omittedCount++;
            } else {
                $("#search-results").append(
                    "<div class='card card-animation' style='width: 15rem;' id='card-item-"+ item.ID + "'>" +
                        "<img class='card-img-top' src='" + baseString + item.Icon + "' alt='Card image top'>" +
                            "<div class='card-body'>" +
                            "<h5 class='card-title'>" + item.Name + "</h5>" +
                            "<p class='card-text'>Price: " + data["Prices"][0]["PricePerUnit"] + " gil</p>" +
                        "</div>" +
                    "</div>");
                $("#card-item-"+item.ID).on("click", () => {
                    fetch(baseString + "/item/" + item.ID)
                        .then(res => res.json())
                        .then(res => {
                            createModal(item, data, res);
                            console.log(res);
                        });
                });
            }
        })
        .catch((err) => {
            console.log("failed @ " + baseString+"/market/" + "cerberus" + "/item/" + item.ID);
            console.log("reason: " + err);
        });
}

async function createModal(item, priceHistory, itemDetails) {
    let prices = [];
    let dates = [];
    let nqPrices = [];
    let hqPrices = [];

    let currentResultsAmount = 5;

    allGraph = true;
    nqGraph = false;
    hqGraph = false;

    //for (let x = priceHistory.Prices.length; x > 1; x--) {
    //    prices.push(convertEpoch(priceHistory.Prices[x]["Added"]));
    //}
    
    for (let x = 0; x < priceHistory.History.length; x++) {
        dates.push(convertEpoch(priceHistory.History[x]["PurchaseDate"]));
        prices.push(priceHistory.History[x]["PricePerUnit"]);
        if (priceHistory.History[x]["IsHQ"]) {
            hqPrices.push(priceHistory.History[x]["PricePerUnit"]);
            nqPrices.push(null);
        } else {
            nqPrices.push(priceHistory.History[x]["PricePerUnit"]);
            hqPrices.push(null);
        }
    }
    $("#search-modal-container").append("" +
        "<div class='modal-dialog modal-lg' tabindex='-1' role='dialog' aria-labelledby='largeModal' aria-hidden='true'>" +
            "<div class='modal-content'>" +
                "<div class='modal-header'>" +
                    "<h5 class='modal-title'>" + item.Name + "</h5>" +
                    "<button type='button' class='btn btn-primary' data-dismiss='modal' aria-label='Close'>X</button>" +
                "</div>" +
                "<div class='modal-body'>" +
                    "<p>" + itemDetails.Description + "</p>" +
                    "<canvas id='price-chart' width='400' height='200'></canvas>" +
                    "<p>Amount of results to show</p>" +
                    "<div class='btn-group btn-group-toggle btn-block' role='group' data-toggle='buttons'>" +
                        "<label class='btn btn-success mw-33 active' id='05-prices'>" +
                            "<input type='radio' name='options' checked> 5" +
                        "</label>" +
                        "<label class='btn btn-secondary mw-33' id='15-prices'>" +
                            "<input type='radio' name='options'> 15" +
                        "</label>" +
                        "<label class='btn btn-secondary mw-33' id='25-prices'>" +
                            "<input type='radio' name='options'> 25" +
                        "</label>" +
                    "</div>" +
                    "<div class='btn-group btn-group-toggle btn-block' role='group' data-toggle='buttons'>" +
                        "<label class='btn btn-success mw-33' id='items-all'>" +
                            "<input type='checkbox'>All items" +
                        "</label>" +
                        "<label class='btn btn-secondary mw-33' id='items-nq'>" +
                            "<input type='checkbox'>NQ only" +
                        "</label>" +
                        "<label class='btn btn-secondary mw-33' id='items-hq'>" +
                            "<input type='checkbox'>HQ only" +
                        "</label>" +
                    "</div>" +
                    "<hr>" +
                "</div>" +
            "</div>" +
        "</div>");
    $("#search-modal-container").modal("show");
    $("#search-modal-container").on("hidden.bs.modal", () => {
        $("#search-modal-container").empty();
    });

    $("[id$=-prices]").on("click", async (evt) => { 
        $("#price-chart").empty();
        colourSetter(evt.target.id.substring(0, 2));
        currentResultsAmount = Number(evt.target.id.substring(0, 2));
        updateChart(priceChart, dates, prices, nqPrices, hqPrices, currentResultsAmount);
    });

    $("[id^=items-]").on("click", (evt) => {
        switch(evt.target.id.substring(evt.target.id.length-2, evt.target.id.length)) {
            case "ll": allGraph = allGraph === true ? false : true; break;
            case "nq": nqGraph = nqGraph === true ? false : true; break;
            case "hq": hqGraph = hqGraph === true ? false : true; break;
            default: break;
        }
        if (evt.target.classList.contains("btn-success")) {
            evt.target.classList.remove("btn-success");
            evt.target.classList.add("btn-secondary");
        } else {
            evt.target.classList.remove("btn-secondary");
            evt.target.classList.add("btn-success");
        }
        updateChart(priceChart, dates, prices, nqPrices, hqPrices, currentResultsAmount);
    });
    priceChart = new Chart($("#price-chart"), {
        type: "line",
        data: { 
            labels: null,
            datasets: [{
                //graph 1
            },{
                //graph 2
            },{
                //graph 3
            }]
         }
    });
    updateChart(priceChart, dates, prices, nqPrices, hqPrices, currentResultsAmount);
}

function updateChart(pc, dates, prices, nqp, hqp, max) {
    let tempDates = [];
    let tempPrices = [];
    let tempNq = [];
    let tempHq = [];
    let adjustedMax;
    console.log(dates.length);
    if (max > dates.length) { adjustedMax = dates.length; } 
        else { adjustedMax = max }
    console.log(adjustedMax);
    for (let x = adjustedMax; x > 0; x--) {
        console.log(x);
        tempDates.push(dates[x].toLocaleDateString("en-US"));
        tempPrices.push(prices[x]);
        tempNq.push(nqp[x]);
        tempHq.push(hqp[x]);
    }

    if (!allGraph) { tempPrices = []; }
    if (!nqGraph) { tempNq = []; }
    if (!hqGraph) { tempHq = []; }

    pc.data.labels = tempDates;
    pc.data.datasets = [{
            label: 'Price in Gil',
            data: tempPrices,
            backgroundColor: "Red",
            fill: false
        }, {
            label: "NQ",
            data: tempNq,
            backgroundColor: "Green",
            fill: false
        }, {
            label: "HQ",
            data: tempHq,
            backgroundColor: "Blue",
            fill: false
        }];
    console.log(tempPrices);
    console.log(tempNq);
    console.log(tempHq);
    console.log(allGraph, nqGraph, hqGraph);
    console.log(pc.data.datasets);

    pc.update();
}

function populateDropDown(source) {
    selectedDc = dataCentersAndServers[source];
    $("#server-list").empty();
    $("#server-list").append("<option selected disabled hidden>Select Server</option>");
    selectedDc.forEach(function(element) {
        $("#server-list").append("<option value='" + element + "'>" + element + "</option>");
    });
}

function firstTimeModal() {
    var server = Cookies.get("homeServer");
    $("#server-title").html(server);
    if (server === undefined) {
        $("#server-modal-container").append(
            "<div class='modal-dialog modal-lg modal-dialog-centered' tabindex='-1' role='dialog'>" +
                "<div class='modal-content'>" +
                    "<div class='modal-header' style='display: flex; flex-direction: column;'>" +
                        "<h5 class='modal-title mx-auto'>Select a server</h5>" +
                    "</div>" +
                    "<div class='modal-body'>" +
                        "<select class='form-control' id='data-center-list'>" +
                            "<option selected disabled hidden>Select Data Center</option>" +
                            "<option value='Aether'>Aether</option>" +
                            "<option value='Chaos'>Chaos</option>" +
                            "<option value='Crystal'>Crystal</option>" +
                            "<option value='Elemental'>Elemental</option>" +
                            "<option value='Gaia'>Gaia</option>" +
                            "<option value='Light'>Light</option>" +
                            "<option value='Mana'>Mana</option>" +
                            "<option value='Primal'>Primal</option>" +
                        "</select>" +
                        "<select disabled class='form-control' id='server-list'>" +
                            "<option selected disabled hidden>Select Data Center first</option>" +
                        "</select>" +
                        "<br/>" +
                        "<button class='btn btn-primary btn-block' id='btn-save-server'>" +
                            "Save server" +
                        "</button>" +
                    "</div>" +
                "</div>" +
            "</div>");
            if (!serverPicked) {
                $(".modal-header").append(
                    "<div class='alert alert-danger mx-auto'>" +
                        "Please select a server!" +
                    "</div>"
                );
            }
            $("#data-center-list").on("change", function(evt) {
                $("#server-list").prop("disabled", false);
                populateDropDown($(this).val());
            });

            $("#btn-save-server").on("click", (evt) => {
                Cookies.set("homeServer", $("#server-list").val());
                $("#debug-server").html("Using server: " + Cookies.get("homeServer") + "<a id='change-server-link'> (Change?)</a>");
                $("#server-modal-container").modal("hide");
            });

            $("#data-center-list")[0].selectedIndex = 0;
            $("#server-list")[0].selectedIndex = 0;

            $("#server-modal-container").on("hidden.bs.modal", (evt) => {
                $("#server-modal-container").empty();
                if (Cookies.get("homeServer") === undefined) {
                    serverPicked = false;
                    firstTimeModal();
                } else serverPicked = true;
                $("#server-title").html(Cookies.get("homeServer"));
            });

            $("#server-modal-container").modal("show");
        }
    }
}

//helper functions
function convertEpoch(epochTime) {
    return new Date(epochTime * 1000);
}

async function offThreadChecker(e) {
    return await e.checked == true ? true : false;
}

function colourSetter(x) {
    $("#05-prices")[0].classList.remove("btn-secondary");
    $("#15-prices")[0].classList.remove("btn-secondary");
    $("#25-prices")[0].classList.remove("btn-secondary");
    $("#05-prices")[0].classList.remove("btn-success");
    $("#15-prices")[0].classList.remove("btn-success");
    $("#25-prices")[0].classList.remove("btn-success");
    switch(Number(x)) {
        case 05: 
            $("#05-prices")[0].classList.add("btn-success");
            $("#15-prices")[0].classList.add("btn-secondary");
            $("#25-prices")[0].classList.add("btn-secondary");
            break;
        case 15: 
            $("#05-prices")[0].classList.add("btn-secondary");
            $("#15-prices")[0].classList.add("btn-success");
            $("#25-prices")[0].classList.add("btn-secondary");
            break;
        case 25: 
            $("#05-prices")[0].classList.add("btn-secondary");
            $("#15-prices")[0].classList.add("btn-secondary");
            $("#25-prices")[0].classList.add("btn-success");
            break;
        default: break; //should never hit this anyway hehe
    }
}