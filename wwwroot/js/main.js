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

var createDbTime = 0;
var count = 0;
var itemDb;
var dataCentersAndServers = [];
var prefs = [];
var serverPicked = true;

var searchBlocker;

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
    var results = await itemDb.filter(n => n.Name.toLowerCase().includes(query));
    $("#search-results").empty();
    let max = results.length > 20 ? 20 : results.length;
    for (let c = 0; c < max; c++) {
        createCard(Cookies.get("homeServer"), results[c]);
    }
}

async function createCard(server, item) {
    await fetch(baseString+"/market/" + server + "/item/" + item.ID)
        .then(data => data.json())
        .then((data) => {
            console.log("found " + data);
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
                    });
            });
        })
        .catch(err => {
            console.log("failed @ " + baseString+"/market/" + server + "/item/" + item.ID);
            console.log("reason: " + err)
        });
}

async function createModal(item, priceHistory, itemDetails) {
    let prices = [];
    let dates = [];
    //for (let x = priceHistory.Prices.length; x > 1; x--) {
    //    prices.push(convertEpoch(priceHistory.Prices[x]["Added"]));
    //}
    for (let x = 0; x < priceHistory.History.length; x++) {
        dates.push(convertEpoch(priceHistory.History[x]["Added"]));
        prices.push(priceHistory.History[x]["PricePerUnit"]);
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
                    "<div class='btn-group btn-group-toggle btn-block' data-toggle='buttons'>" +
                        "<label class='btn btn-secondary mx-auto active' id='5-prices'>" +
                            "<input type='radio' name='options' checked> 5" +
                        "</label>" +
                        "<label class='btn btn-secondary' id='15-prices'>" +
                            "<input type='radio' name='options'> 15" +
                        "</label>" +
                        "<label class='btn btn-secondary' id='25-prices'>" +
                            "<input type='radio' name='options'> 25" +
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
    $("#5-prices").on("click", (evt) => { 
        $("#price-chart").empty();
        createChart($("#price-chart"), dates, prices, 5);
    });
    $("#15-prices").on("click", (evt) => { 
        $("#price-chart").empty();
        createChart($("#price-chart"), dates, prices, 15);
    });
    $("#25-prices").on("click", (evt) => { 
        $("#price-chart").empty();
        createChart($("#price-chart"), dates, prices, 25);
    });
    createChart($("#price-chart"), dates, prices, 5);
}

function createChart(canvas, dates, prices, max) {
    //console.log(history);
    let tempDates = [];
    let tempPrices = [];
    for (let x = max; x > 0; x--) {
        tempDates.push(dates[x].toLocaleDateString("en-US"));
        tempPrices.push(prices[x]);
    }
    let c = new Chart(canvas, {
        type: 'line',
        data: {
            labels: tempDates,
            datasets: [{
                label: 'Price in Gil',
                data: tempPrices,
            }]
        }
    });
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
                $("#debug-server").html("Using server: " + Cookies.get("homeServer"));
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